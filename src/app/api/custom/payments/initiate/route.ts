import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  createFapshiService,
  formatPhoneNumber,
  generateExternalId,
  validatePhoneNumber,
} from '@/utilities/fapshi'
import { getSubscriptionCosts } from '@/utilities/subscription'
import {
  authenticatePaymentUser,
  getServerPlanAmount,
  isTrustedRequestOrigin,
  PAYMENT_INITIATION_LIMIT,
  PAYMENT_INITIATION_WINDOW_MS,
  parsePaymentInitiationInput,
} from '@/utilities/paymentSecurity'

const unauthorized = () => NextResponse.json({ error: 'Authentication required' }, { status: 401 })

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const user = await authenticatePaymentUser(payload, request.headers)

    if (!user) return unauthorized()

    if (!isTrustedRequestOrigin(request.url, request.headers)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    let input
    try {
      input = parsePaymentInitiationInput(await request.json())
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid payment request' },
        { status: 400 },
      )
    }

    const formattedPhone = formatPhoneNumber(input.phone)
    if (!validatePhoneNumber(formattedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    const rateLimitWindowStart = new Date(Date.now() - PAYMENT_INITIATION_WINDOW_MS).toISOString()
    const recentTransactions = await payload.count({
      collection: 'transactions',
      where: {
        and: [{ user: { equals: user.id } }, { createdAt: { greater_than: rateLimitWindowStart } }],
      },
    })

    if (recentTransactions.totalDocs >= PAYMENT_INITIATION_LIMIT) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please wait before trying again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(PAYMENT_INITIATION_WINDOW_MS / 1000)) },
        },
      )
    }

    const subscriptionCosts = await getSubscriptionCosts(payload)
    let amount: number

    try {
      amount = getServerPlanAmount(input.plan, subscriptionCosts)
    } catch (error) {
      console.error('Payment price configuration error:', error)
      return NextResponse.json({ error: 'Payment pricing is unavailable' }, { status: 503 })
    }

    const existingSubscriptions = await payload.find({
      collection: 'subscriptions',
      where: { user: { equals: user.id } },
      limit: 1,
      sort: '-createdAt',
      depth: 0,
      user,
      overrideAccess: false,
    })
    const subscriptionId = existingSubscriptions.docs[0]?.id
    const externalId = generateExternalId('sv')

    // This is an intentional system write: the route has authenticated the owner and
    // derives every privileged transaction field on the server.
    const transaction = await payload.create({
      collection: 'transactions',
      data: {
        user: user.id,
        ...(subscriptionId ? { subscription: subscriptionId } : {}),
        transactionId: externalId,
        amount,
        plan: input.plan,
        status: 'created',
        phone: formattedPhone,
        paymentMedium: input.medium,
        dateInitiated: new Date().toISOString(),
        externalId,
        webhookReceived: false,
        statusCheckCount: 0,
        reconciled: false,
      },
    })

    const fapshiService = createFapshiService()

    try {
      const fapshiResponse = await fapshiService.initiatePayment({
        amount,
        phone: formattedPhone,
        medium: input.medium,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        userId: user.id,
        externalId,
        message: `${input.plan === 'monthly' ? 'Monthly' : 'Annual'} subscription payment`,
      })

      await payload.update({
        collection: 'transactions',
        id: transaction.id,
        data: {
          fapshiTransId: fapshiResponse.transId,
          status: 'pending',
        },
      })

      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        status: 'pending',
        message: 'Payment initiated successfully',
        dateInitiated: fapshiResponse.dateInitiated,
      })
    } catch (fapshiError) {
      console.error('Fapshi payment initiation failed:', fapshiError)

      await payload.update({
        collection: 'transactions',
        id: transaction.id,
        data: {
          status: 'failed',
          notes: `Fapshi error: ${(fapshiError as Error).message || String(fapshiError)}`,
        },
      })

      return NextResponse.json(
        { error: 'Payment initiation failed', transactionId: transaction.id },
        { status: 502 },
      )
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const user = await authenticatePaymentUser(payload, request.headers)

    if (!user) return unauthorized()

    const transactionId = new URL(request.url).searchParams.get('transactionId')
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    let transaction
    try {
      transaction = await payload.findByID({
        collection: 'transactions',
        id: transactionId,
        depth: 0,
        user,
        overrideAccess: false,
      })
    } catch {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      dateInitiated: transaction.dateInitiated,
      dateConfirmed: transaction.dateConfirmed,
      webhookReceived: transaction.webhookReceived,
    })
  } catch (error) {
    console.error('Get payment status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
