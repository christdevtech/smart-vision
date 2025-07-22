import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createFapshiService } from '@/utilities/fapshi'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const fapshiService = createFapshiService()
    
    // Parse webhook payload
    const webhookData = await request.json()
    
    // Validate webhook payload
    if (!fapshiService.validateWebhookPayload(webhookData)) {
      console.error('Invalid webhook payload:', webhookData)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const {
      transId,
      status,
      amount,
      revenue,
      payerName,
      email,
      externalId,
      userId,
      medium,
      financialTransId,
      dateInitiated,
      dateConfirmed,
    } = webhookData

    console.log(`Webhook received for transaction ${transId} with status ${status}`)

    // Find existing transaction by Fapshi transaction ID
    const existingTransactions = await payload.find({
      collection: 'transactions',
      where: {
        fapshiTransId: {
          equals: transId,
        },
      },
      limit: 1,
    })

    if (existingTransactions.docs.length === 0) {
      console.error(`Transaction not found for Fapshi ID: ${transId}`)
      // Still return 200 to acknowledge webhook receipt
      return NextResponse.json({ 
        received: true, 
        error: 'Transaction not found',
        transId 
      })
    }

    const transaction = existingTransactions.docs[0]
    const internalStatus = fapshiService.mapFapshiStatus(status)

    // Prepare update data
    const updateData: any = {
      status: internalStatus,
      webhookReceived: true,
      webhookReceivedAt: new Date().toISOString(),
      revenue: revenue || transaction.revenue,
      paymentMedium: medium || transaction.paymentMedium,
      financialTransId: financialTransId || transaction.financialTransId,
    }

    // Set confirmation date for successful payments
    if (status === 'SUCCESSFUL' && !transaction.dateConfirmed) {
      updateData.dateConfirmed = dateConfirmed || new Date().toISOString()
    }

    // Update transaction
    await payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: updateData,
    })

    // Handle successful payment
    if (status === 'SUCCESSFUL') {
      await handleSuccessfulPayment(payload, transaction, webhookData)
    }

    // Handle failed payment
    if (status === 'FAILED') {
      await handleFailedPayment(payload, transaction, webhookData)
    }

    // Handle expired payment
    if (status === 'EXPIRED') {
      await handleExpiredPayment(payload, transaction, webhookData)
    }

    console.log(`Transaction ${transId} updated successfully with status ${status}`)

    return NextResponse.json({ 
      received: true, 
      transId,
      status: internalStatus 
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Always return 200 to prevent webhook retries
    // Log the error for manual investigation
    return NextResponse.json({ 
      received: true, 
      error: 'Processing error logged' 
    })
  }
}

async function handleSuccessfulPayment(payload: any, transaction: any, webhookData: any) {
  try {
    // Update related subscription if exists
    if (transaction.subscription) {
      await payload.update({
        collection: 'subscriptions',
        id: transaction.subscription,
        data: {
          paymentStatus: 'paid',
        },
      })
    }

    // Send confirmation email (if email service is configured)
    // await sendPaymentConfirmationEmail(transaction.user, webhookData)

    // Log successful payment
    console.log(`Payment successful for user ${transaction.user}, amount: ${webhookData.amount}`)

  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

async function handleFailedPayment(payload: any, transaction: any, webhookData: any) {
  try {
    // Update related subscription if exists
    if (transaction.subscription) {
      await payload.update({
        collection: 'subscriptions',
        id: transaction.subscription,
        data: {
          paymentStatus: 'failed',
        },
      })
    }

    // Log failed payment
    console.log(`Payment failed for user ${transaction.user}, transaction: ${webhookData.transId}`)

  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
}

async function handleExpiredPayment(payload: any, transaction: any, webhookData: any) {
  try {
    // Update related subscription if exists
    if (transaction.subscription) {
      await payload.update({
        collection: 'subscriptions',
        id: transaction.subscription,
        data: {
          paymentStatus: 'expired',
        },
      })
    }

    // Log expired payment
    console.log(`Payment expired for user ${transaction.user}, transaction: ${webhookData.transId}`)

  } catch (error) {
    console.error('Error handling expired payment:', error)
  }
}