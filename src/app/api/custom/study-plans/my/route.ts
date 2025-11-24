import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = request as any

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await payload.find({
      collection: 'study-plans',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    const plan = plans.docs[0] || null
    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}