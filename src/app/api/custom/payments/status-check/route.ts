import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createFapshiService } from '@/utilities/fapshi'
import { 
  determineSubscriptionPlan, 
  findOrCreateUserSubscription, 
  getSubscriptionCosts 
} from '@/utilities/subscription'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const fapshiService = createFapshiService()

    // Get all pending transactions that need status checks
    const pendingTransactions = await payload.find({
      collection: 'transactions',
      where: {
        and: [
          {
            status: {
              in: ['created', 'pending'],
            },
          },
          {
            fapshiTransId: {
              exists: true,
            },
          },
          {
            or: [
              {
                lastStatusCheck: {
                  exists: false,
                },
              },
              {
                lastStatusCheck: {
                  less_than: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
                },
              },
            ],
          },
        ],
      },
      limit: 50, // Process in batches
      sort: 'dateInitiated',
    })

    const results = []

    for (const transaction of pendingTransactions.docs) {
      try {
        // Check status with Fapshi
        if (!transaction.fapshiTransId) {
          throw new Error('Missing fapshiTransId')
        }
        const fapshiTransaction = await fapshiService.getPaymentStatus(transaction.fapshiTransId)

        if (fapshiTransaction.transId) {
          // const fapshiTransaction = fapshiTransactions[0]
          const newStatus = fapshiService.mapFapshiStatus(fapshiTransaction.status)

          // Prepare update data
          const updateData: any = {
            lastStatusCheck: new Date().toISOString(),
            statusCheckCount: (transaction.statusCheckCount || 0) + 1,
          }

          // Update status if changed
          if (newStatus !== transaction.status) {
            updateData.status = newStatus
            updateData.revenue = fapshiTransaction.revenue
            updateData.paymentMedium = fapshiTransaction.medium
            updateData.financialTransId = fapshiTransaction.financialTransId

            if (fapshiTransaction.status === 'SUCCESSFUL' && !transaction.dateConfirmed) {
              updateData.dateConfirmed = fapshiTransaction.dateConfirmed || new Date().toISOString()
            }
          }

          // Update transaction
          await payload.update({
            collection: 'transactions',
            id: transaction.id,
            data: updateData,
          })

          // Handle status changes
          if (newStatus !== transaction.status) {
            await handleStatusChange(payload, transaction, newStatus, fapshiTransaction)
          }

          results.push({
            transactionId: transaction.id,
            fapshiTransId: transaction.fapshiTransId,
            oldStatus: transaction.status,
            newStatus,
            updated: newStatus !== transaction.status,
          })
        } else {
          // No transaction found in Fapshi
          await payload.update({
            collection: 'transactions',
            id: transaction.id,
            data: {
              lastStatusCheck: new Date().toISOString(),
              statusCheckCount: (transaction.statusCheckCount || 0) + 1,
              notes: 'Transaction not found in Fapshi API',
            },
          })

          results.push({
            transactionId: transaction.id,
            fapshiTransId: transaction.fapshiTransId,
            error: 'Transaction not found in Fapshi',
          })
        }
      } catch (error) {
        console.error(`Error checking status for transaction ${transaction.id}:`, error)

        // Update error count
        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: {
            lastStatusCheck: new Date().toISOString(),
            statusCheckCount: (transaction.statusCheckCount || 0) + 1,
            notes: `Status check error: ${(error as Error).message || String(error)}`,
          },
        })

        results.push({
          transactionId: transaction.id,
          fapshiTransId: transaction.fapshiTransId,
          error: `Status check error: ${(error as Error).message || String(error)}`,
        })
      }

      // Add delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Status check service error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleStatusChange(
  payload: any,
  transaction: any,
  newStatus: string,
  fapshiTransaction: any,
) {
  try {
    if (newStatus === 'successful') {
      // Get subscription costs to determine plan
      const subscriptionCosts = await getSubscriptionCosts(payload)
      
      // Determine subscription plan based on transaction amount
      const plan = determineSubscriptionPlan(transaction.amount, subscriptionCosts)
      
      if (plan) {
        // Create or update subscription with proper dates
        const subscription = await findOrCreateUserSubscription(
          payload,
          transaction.user,
          plan,
          transaction.amount,
          transaction.id
        )
        
        console.log(`Subscription ${subscription.id} updated for user ${transaction.user}, plan: ${plan}`)
        
        // Update transaction with subscription reference if not already set
        if (!transaction.subscription) {
          await payload.update({
            collection: 'transactions',
            id: transaction.id,
            data: {
              subscription: subscription.id,
            },
          })
        }
      } else {
        console.warn(`Could not determine subscription plan for amount ${transaction.amount}`)
        
        // Update existing subscription if referenced
        if (transaction.subscription) {
          await payload.update({
            collection: 'subscriptions',
            id: transaction.subscription,
            data: {
              paymentStatus: 'paid',
            },
          })
        }
      }
    } else {
      // Handle failed/expired payments
      if (transaction.subscription) {
        let subscriptionStatus = 'pending'

        if (newStatus === 'failed' || newStatus === 'expired') {
          subscriptionStatus = newStatus
        }

        await payload.update({
          collection: 'subscriptions',
          id: transaction.subscription,
          data: {
            paymentStatus: subscriptionStatus,
          },
        })
      }
    }

    console.log(
      `Transaction ${transaction.id} status changed from ${transaction.status} to ${newStatus}`,
    )
  } catch (error) {
    console.error('Error handling status change:', error)
  }
}

// Manual status check for specific transaction
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const fapshiService = createFapshiService()

    // Get transaction
    const transaction = await payload.findByID({
      collection: 'transactions',
      id: transactionId,
    })

    if (!transaction || !transaction.fapshiTransId) {
      return NextResponse.json(
        { error: 'Transaction not found or missing Fapshi ID' },
        { status: 404 },
      )
    }

    // Check status with Fapshi
    const fapshiTransaction = await fapshiService.getPaymentStatus(transaction.fapshiTransId)

    if (!fapshiTransaction.transId) {
      return NextResponse.json({ error: 'Transaction not found in Fapshi' }, { status: 404 })
    }

    const newStatus = fapshiService.mapFapshiStatus(fapshiTransaction.status)

    // Update transaction
    const updateData: any = {
      lastStatusCheck: new Date().toISOString(),
      statusCheckCount: (transaction.statusCheckCount || 0) + 1,
    }

    if (newStatus !== transaction.status) {
      updateData.status = newStatus
      updateData.revenue = fapshiTransaction.revenue
      updateData.paymentMedium = fapshiTransaction.medium
      updateData.financialTransId = fapshiTransaction.financialTransId

      if (fapshiTransaction.status === 'SUCCESSFUL' && !transaction.dateConfirmed) {
        updateData.dateConfirmed = fapshiTransaction.dateConfirmed || new Date().toISOString()
      }
    }

    await payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: updateData,
    })

    return NextResponse.json({
      transactionId: transaction.id,
      fapshiTransId: transaction.fapshiTransId,
      oldStatus: transaction.status,
      newStatus,
      updated: newStatus !== transaction.status,
      fapshiData: fapshiTransaction,
    })
  } catch (error) {
    console.error('Manual status check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
