import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createFapshiService } from '@/utilities/fapshi'
import { processVerifiedPaymentStatus } from '@/services/paymentSettlement'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const fapshiService = createFapshiService()
    const webhookData = await request.json()

    if (!fapshiService.validateWebhookPayload(webhookData)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Fapshi does not document a callback signature. Treat the callback only as a
    // signal, locate a transaction we already initiated, then re-query Fapshi using
    // server-held credentials before changing any financial state.
    const existingTransactions = await payload.find({
      collection: 'transactions',
      where: { fapshiTransId: { equals: webhookData.transId } },
      limit: 1,
      depth: 0,
    })

    const transaction = existingTransactions.docs[0]
    if (!transaction?.fapshiTransId) {
      payload.logger.warn(`Ignoring Fapshi webhook for unknown transaction ${webhookData.transId}`)
      return NextResponse.json({ received: true, processed: false })
    }

    const providerTransaction = await fapshiService.getPaymentStatus(transaction.fapshiTransId)
    const result = await processVerifiedPaymentStatus(
      payload,
      transaction,
      providerTransaction,
      'webhook',
    )

    return NextResponse.json({
      received: true,
      processed: true,
      status: result.status,
      settled: result.settled,
      alreadySettled: result.alreadySettled,
    })
  } catch (error) {
    const payload = await getPayload({ config })
    payload.logger.error({ msg: 'Fapshi webhook verification failed', err: error })

    // Fapshi currently documents a single callback delivery. Acknowledging the signal
    // avoids false retries; authenticated status polling remains the recovery path.
    return NextResponse.json({ received: true, processed: false })
  }
}
