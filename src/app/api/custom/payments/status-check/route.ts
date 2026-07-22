import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createFapshiService } from '@/utilities/fapshi'
import {
  authenticatePaymentUser,
  authorizePaymentOperator,
  getRetryAfterSeconds,
  PAYMENT_POLL_INTERVAL_MS,
} from '@/utilities/paymentSecurity'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const operator = await authorizePaymentOperator(payload, request.headers)

    if (!operator) {
      return NextResponse.json({ error: 'Admin or cron authorization required' }, { status: 401 })
    }

    const fapshiService = createFapshiService()
    const pendingTransactions = await payload.find({
      collection: 'transactions',
      where: {
        and: [
          { status: { in: ['created', 'pending'] } },
          { fapshiTransId: { exists: true } },
          {
            or: [
              { lastStatusCheck: { exists: false } },
              {
                lastStatusCheck: {
                  less_than: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                },
              },
            ],
          },
        ],
      },
      limit: 50,
      sort: 'dateInitiated',
      depth: 0,
    })

    const results = []

    for (const transaction of pendingTransactions.docs) {
      try {
        if (!transaction.fapshiTransId) throw new Error('Missing Fapshi transaction ID')

        const fapshiTransaction = await fapshiService.getPaymentStatus(transaction.fapshiTransId)
        const now = new Date().toISOString()

        if (!fapshiTransaction.transId) {
          await payload.update({
            collection: 'transactions',
            id: transaction.id,
            data: {
              lastStatusCheck: now,
              statusCheckCount: (transaction.statusCheckCount || 0) + 1,
              notes: 'Transaction not found in Fapshi API',
            },
          })

          results.push({ transactionId: transaction.id, error: 'Provider transaction not found' })
          continue
        }

        const newStatus = fapshiService.mapFapshiStatus(fapshiTransaction.status)
        const updateData: Record<string, unknown> = {
          lastStatusCheck: now,
          statusCheckCount: (transaction.statusCheckCount || 0) + 1,
        }

        if (newStatus !== transaction.status) {
          updateData.status = newStatus
          updateData.revenue = fapshiTransaction.revenue
          updateData.paymentMedium = fapshiTransaction.medium
          updateData.financialTransId = fapshiTransaction.financialTransId

          if (fapshiTransaction.status === 'SUCCESSFUL' && !transaction.dateConfirmed) {
            updateData.dateConfirmed = fapshiTransaction.dateConfirmed || now
          }
        }

        // Transaction hooks perform the corresponding subscription update once the
        // provider-confirmed status is persisted.
        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: updateData,
        })

        results.push({
          transactionId: transaction.id,
          oldStatus: transaction.status,
          newStatus,
          updated: newStatus !== transaction.status,
        })
      } catch (error) {
        console.error(`Error checking status for transaction ${transaction.id}:`, error)

        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: {
            lastStatusCheck: new Date().toISOString(),
            statusCheckCount: (transaction.statusCheckCount || 0) + 1,
            notes: `Status check error: ${(error as Error).message || String(error)}`,
          },
        })

        results.push({ transactionId: transaction.id, error: 'Status check failed' })
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return NextResponse.json({ success: true, processed: results.length, results })
  } catch (error) {
    console.error('Status check service error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const user = await authenticatePaymentUser(payload, request.headers)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

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

    if (!transaction.fapshiTransId) {
      return NextResponse.json({ error: 'Transaction is not ready for polling' }, { status: 409 })
    }

    const retryAfter = getRetryAfterSeconds(transaction.lastStatusCheck, PAYMENT_POLL_INTERVAL_MS)

    if (retryAfter > 0) {
      return NextResponse.json(
        { error: 'Payment status was checked too recently', status: transaction.status },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

    const fapshiService = createFapshiService()
    const fapshiTransaction = await fapshiService.getPaymentStatus(transaction.fapshiTransId)

    if (!fapshiTransaction.transId) {
      return NextResponse.json(
        { error: 'Transaction not found in payment provider' },
        { status: 404 },
      )
    }

    const newStatus = fapshiService.mapFapshiStatus(fapshiTransaction.status)
    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = {
      lastStatusCheck: now,
      statusCheckCount: (transaction.statusCheckCount || 0) + 1,
    }

    if (newStatus !== transaction.status) {
      updateData.status = newStatus
      updateData.revenue = fapshiTransaction.revenue
      updateData.paymentMedium = fapshiTransaction.medium
      updateData.financialTransId = fapshiTransaction.financialTransId

      if (fapshiTransaction.status === 'SUCCESSFUL' && !transaction.dateConfirmed) {
        updateData.dateConfirmed = fapshiTransaction.dateConfirmed || now
      }
    }

    await payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: updateData,
    })

    return NextResponse.json({
      transactionId: transaction.id,
      oldStatus: transaction.status,
      newStatus,
      updated: newStatus !== transaction.status,
    })
  } catch (error) {
    console.error('Manual status check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
