import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = request as any

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const plans = await payload.find({
      collection: 'study-plans',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    const data = { ...body, user: user.id }

    let plan
    if (plans.docs[0]) {
      plan = await payload.update({ collection: 'study-plans', id: plans.docs[0].id, data })
    } else {
      plan = await payload.create({ collection: 'study-plans', data })
    }

    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}