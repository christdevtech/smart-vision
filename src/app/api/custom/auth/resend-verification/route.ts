import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { consumeAuthRateLimit } from '@/utilities/authRateLimit'

type VerificationUser = {
  _verified?: boolean
  email: string
}

type VerificationUserModel = {
  findOne: (filter: Record<string, unknown>) => {
    lean: () => Promise<VerificationUser | null>
  }
  updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<unknown>
}

const GENERIC_RESPONSE = {
  message: 'If this account still needs verification, a new email has been sent.',
}

export async function POST(request: NextRequest) {
  const rateLimit = consumeAuthRateLimit({
    headers: request.headers,
    operation: 'resendVerification',
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429 },
    )
  }

  let email = ''
  try {
    const body = (await request.json()) as { email?: unknown }
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const model = payload.db.collections.users as unknown as VerificationUserModel
  const user = await model.findOne({ email }).lean()

  if (user && user._verified === false) {
    const token = randomBytes(20).toString('hex')
    await model.updateOne({ email }, { $set: { _verificationToken: token } })

    const baseURL = (process.env.NEXT_PUBLIC_SERVER_URL || request.nextUrl.origin).replace(
      /\/$/,
      '',
    )
    const verificationURL = `${baseURL}/auth/verify-email?token=${encodeURIComponent(token)}`
    await payload.sendEmail({
      to: user.email,
      subject: 'Verify your Smart Vision email',
      html: `<p>Hello,</p><p><a href="${verificationURL}">Verify your email address</a> to activate your Smart Vision account.</p>`,
    })
  }

  return NextResponse.json(GENERIC_RESPONSE)
}
