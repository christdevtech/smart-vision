import type { Setting, User } from '@/payload-types'
import type { Payload } from 'payload'
import {
  authenticateRequestUser,
  authorizeAdministrativeRequest,
  hasValidBearerAuthorization,
} from '@/utilities/requestAuthorization'

export const PAYMENT_INITIATION_WINDOW_MS = 10 * 60 * 1000
export const PAYMENT_INITIATION_LIMIT = 5
export const PAYMENT_POLL_INTERVAL_MS = 4 * 1000

export type PaidSubscriptionPlan = 'monthly' | 'annual'
export type PaymentMedium = 'mobile money' | 'orange money'

export interface PaymentInitiationInput {
  plan: PaidSubscriptionPlan
  phone: string
  medium?: PaymentMedium
}

const FORBIDDEN_PAYMENT_FIELDS = [
  'amount',
  'email',
  'message',
  'name',
  'subscriptionId',
  'userId',
] as const

export function parsePaymentInitiationInput(body: unknown): PaymentInitiationInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Invalid payment request')
  }

  const input = body as Record<string, unknown>
  const forbiddenField = FORBIDDEN_PAYMENT_FIELDS.find((field) => field in input)

  if (forbiddenField) {
    throw new Error(`The ${forbiddenField} field is controlled by the server`)
  }

  if (input.plan !== 'monthly' && input.plan !== 'annual') {
    throw new Error('Plan must be monthly or annual')
  }

  if (typeof input.phone !== 'string' || input.phone.trim().length === 0) {
    throw new Error('Phone number is required')
  }

  if (
    input.medium !== undefined &&
    input.medium !== 'mobile money' &&
    input.medium !== 'orange money'
  ) {
    throw new Error('Invalid payment medium')
  }

  return {
    plan: input.plan,
    phone: input.phone,
    ...(input.medium ? { medium: input.medium } : {}),
  }
}

export function getServerPlanAmount(
  plan: PaidSubscriptionPlan,
  subscriptionCosts: Setting['subscriptionCosts'],
): number {
  const amount = plan === 'monthly' ? subscriptionCosts?.monthly : subscriptionCosts?.yearly

  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 100) {
    throw new Error(`Invalid server price configured for the ${plan} plan`)
  }

  return amount
}

export function getRetryAfterSeconds(
  lastAttempt: string | null | undefined,
  intervalMs: number,
  now = Date.now(),
): number {
  if (!lastAttempt) return 0

  const lastAttemptMs = Date.parse(lastAttempt)
  if (!Number.isFinite(lastAttemptMs)) return 0

  return Math.max(0, Math.ceil((lastAttemptMs + intervalMs - now) / 1000))
}

export function isTrustedRequestOrigin(requestUrl: string, headers: Headers): boolean {
  if (headers.get('sec-fetch-site') === 'cross-site') return false

  const origin = headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).origin === new URL(requestUrl).origin
  } catch {
    return false
  }
}

export function hasValidCronAuthorization(
  authorization: string | null,
  cronSecret: string | undefined,
): boolean {
  return hasValidBearerAuthorization(authorization, cronSecret)
}

export async function authenticatePaymentUser(
  payload: Payload,
  headers: Headers,
): Promise<User | null> {
  return authenticateRequestUser(payload, headers)
}

export async function authorizePaymentOperator(
  payload: Payload,
  headers: Headers,
  cronSecret = process.env.CRON_SECRET,
): Promise<{ kind: 'admin'; user: User } | { kind: 'cron' } | null> {
  const authorization = await authorizeAdministrativeRequest(payload, headers, {
    bearerSecret: cronSecret,
  })

  if (authorization?.kind === 'service') return { kind: 'cron' }
  if (authorization?.kind === 'user') return { kind: 'admin', user: authorization.user }
  return null
}
