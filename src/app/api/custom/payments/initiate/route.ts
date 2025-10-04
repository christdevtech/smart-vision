import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createFapshiService, generateExternalId, validatePhoneNumber, formatPhoneNumber } from '@/utilities/fapshi'
import { 
  determineSubscriptionPlan, 
  findOrCreateUserSubscription, 
  getSubscriptionCosts,
  createSubscription 
} from '@/utilities/subscription'

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
    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || numericAmount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount or minimum amount is 100 XAF' },
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

    // Determine if this is a subscription payment and handle subscription logic
    let finalSubscriptionId = subscriptionId
    
    // Get subscription costs to determine if this is a subscription payment
    const subscriptionCosts = await getSubscriptionCosts(payload)
    const plan = determineSubscriptionPlan(numericAmount, subscriptionCosts)
    
    if (plan) {
      // This is a subscription payment
      if (!finalSubscriptionId) {
        // No subscription ID provided, check if user has an existing subscription
        const existingSubscriptions = await payload.find({
          collection: 'subscriptions',
          where: {
            user: {
              equals: userId,
            },
          },
          limit: 1,
          sort: '-createdAt', // Get the most recent subscription
        })
        
        if (existingSubscriptions.docs.length > 0) {
          // User has an existing subscription, use it for renewal/extension
          finalSubscriptionId = existingSubscriptions.docs[0].id
          console.log(`Found existing subscription ${finalSubscriptionId} for user ${userId}, will extend/renew`)
        } else {
          // No existing subscription, create a new one
          const subscription = await createSubscription(payload, {
            userId,
            plan,
            amount: numericAmount,
          })
          finalSubscriptionId = subscription.id
          console.log(`Created new subscription ${finalSubscriptionId} for user ${userId}, plan: ${plan}`)
        }
      } else {
        // Subscription ID was provided, verify it belongs to the user
        try {
          const providedSubscription = await payload.findByID({
            collection: 'subscriptions',
            id: finalSubscriptionId,
          })
          
          if (providedSubscription.user !== userId) {
            return NextResponse.json(
              { error: 'Subscription does not belong to the specified user' },
              { status: 403 }
            )
          }
          
          console.log(`Using provided subscription ${finalSubscriptionId} for user ${userId}`)
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid subscription ID provided' },
            { status: 400 }
          )
        }
      }
    }

    // Create transaction record first
    const transaction = await payload.create({
      collection: 'transactions',
      data: {
        user: userId,
        subscription: finalSubscriptionId,
        transactionId: externalId,
        amount: numericAmount,
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
      amount: numericAmount,
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