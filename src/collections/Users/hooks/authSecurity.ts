import type {
  CollectionAfterLoginHook,
  CollectionBeforeLoginHook,
  CollectionBeforeOperationHook,
} from 'payload'
import { APIError } from 'payload'
import type { User } from '@/payload-types'
import { consumeAuthRateLimit, type RateLimitedAuthOperation } from '@/utilities/authRateLimit'
import { getPasswordPolicyError } from '@/utilities/passwordPolicy'

const RATE_LIMITED_OPERATIONS = new Set<RateLimitedAuthOperation>([
  'create',
  'forgotPassword',
  'login',
  'resetPassword',
])

export const enforceUserAuthOperation: CollectionBeforeOperationHook<'users'> = async (
  hookArgs,
) => {
  if (RATE_LIMITED_OPERATIONS.has(hookArgs.operation as RateLimitedAuthOperation)) {
    const result = consumeAuthRateLimit({
      headers: hookArgs.req.headers,
      operation: hookArgs.operation as RateLimitedAuthOperation,
    })

    if (!result.allowed) {
      throw new APIError(
        `Too many requests. Try again in ${result.retryAfterSeconds} seconds.`,
        429,
        { retryAfter: result.retryAfterSeconds },
        true,
      )
    }
  }

  if (['create', 'resetPassword', 'update'].includes(hookArgs.operation)) {
    const data = (hookArgs.args as { data?: { email?: string; password?: string } }).data
    if (data?.password) {
      const message = getPasswordPolicyError(data.password, data.email)
      if (message) throw new APIError(message, 400, null, true)
    }
  }

  return hookArgs.args as never
}

export const enforceActiveUserBeforeLogin: CollectionBeforeLoginHook<User> = ({ user }) => {
  if (user.isActive === false) {
    throw new APIError(
      'This account has been deactivated. Contact support for help.',
      403,
      null,
      true,
    )
  }
}

export const recordSuccessfulLogin: CollectionAfterLoginHook<User> = async ({ req, user }) => {
  try {
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { lastActiveAt: new Date().toISOString() },
      context: { recordAuthenticationActivity: true },
      overrideAccess: true,
      req,
    })
  } catch (error) {
    req.payload.logger.warn({ err: error, msg: 'Could not record user login activity' })
  }
}
