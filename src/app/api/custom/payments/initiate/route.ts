import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createFapshiService, generateExternalId, validatePhoneNumber, formatPhoneNumber } from '@/utilities/fapshi'

interface PaymentRequest {
  userId: string
  subscriptionId?: string
  amount: number
  phone: string
  medium?: 'mobile money' | 'orange money'
  name?: string
  email?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const fapshiService = createFapshiService()
    
    // Parse request body
    const {
      userId,
      subscriptionId,
      amount,
      phone,
      medium,
      name,
      email,
      message,
    }: PaymentRequest = await request.json()

    // Validate required fields
    if (!userId || !amount || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, phone' },
        { status: 400 }
      )
    }

    // Validate amount (minimum 100 XAF)
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum amount is 100 XAF' },
        { status: 400 }
      )
    }

    // Validate and format phone number
    if (!validatePhoneNumber(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)

    // Verify user exists
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate unique external ID
    const externalId = generateExternalId('sv')

    // Create transaction record first
    const transaction = await payload.create({
      collection: 'transactions',
      data: {
        user: userId,
        subscription: subscriptionId,
        transactionId: externalId,
        amount,
        status: 'created',
        phone: formattedPhone,
        paymentMedium: medium,
        dateInitiated: new Date().toISOString(),
        externalId,
        webhookReceived: false,
        statusCheckCount: 0,
        reconciled: false,
      },
    })

    // Prepare Fapshi payment request
    const paymentData = {
      amount,
      phone: formattedPhone,
      medium,
      name: name || `${user.firstName} ${user.lastName}`.trim(),
      email: email || user.email,
      userId: userId,
      externalId,
      message: message || 'SmartVision subscription payment',
    }

    try {
      // Initiate payment with Fapshi
      const fapshiResponse = await fapshiService.initiatePayment(paymentData)

      // Update transaction with Fapshi transaction ID
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
        fapshiTransId: fapshiResponse.transId,
        externalId,
        message: 'Payment initiated successfully',
        dateInitiated: fapshiResponse.dateInitiated,
      })

    } catch (fapshiError) {
      console.error('Fapshi payment initiation failed:', fapshiError)

      // Update transaction status to failed
      await payload.update({
        collection: 'transactions',
        id: transaction.id,
        data: {
          status: 'failed',
          notes: `Fapshi error: ${(fapshiError as Error).message || String(fapshiError)}`,
        },
      })

      return NextResponse.json(
        { 
          error: 'Payment initiation failed',
          details: (fapshiError as Error).message || String(fapshiError),
          transactionId: transaction.id,
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Get transaction details
    const transaction = await payload.findByID({
      collection: 'transactions',
      id: transactionId,
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      transactionId: transaction.id,
      fapshiTransId: transaction.fapshiTransId,
      status: transaction.status,
      amount: transaction.amount,
      phone: transaction.phone,
      dateInitiated: transaction.dateInitiated,
      dateConfirmed: transaction.dateConfirmed,
      webhookReceived: transaction.webhookReceived,
    })

  } catch (error) {
    console.error('Get payment status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}