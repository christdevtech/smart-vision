import { timingSafeEqual } from 'node:crypto'
import type { User } from '@/payload-types'
import type { Payload } from 'payload'

export type AdministrativeAuthorization =
  | { kind: 'service' }
  | { kind: 'user'; user: User }

interface AdministrativeAuthorizationOptions {
  allowedRoles?: readonly string[]
  bearerSecret?: string
}

export const ADMINISTRATIVE_ROLES = ['admin', 'super-admin'] as const
export const CONTENT_ADMINISTRATIVE_ROLES = [
  ...ADMINISTRATIVE_ROLES,
  'content-manager',
] as const

export function hasValidBearerAuthorization(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!authorization || !secret) return false

  const actual = Buffer.from(authorization)
  const expected = Buffer.from(`Bearer ${secret}`)

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function authenticateRequestUser(
  payload: Payload,
  headers: Headers,
): Promise<User | null> {
  const { user } = await payload.auth({ headers })
  return (user as User | null) ?? null
}

export function userHasAnyRole(
  user: Pick<User, 'role'> | null | undefined,
  allowedRoles: readonly string[],
): boolean {
  return Boolean(user?.role && allowedRoles.includes(user.role))
}

export async function authorizeAdministrativeRequest(
  payload: Payload,
  headers: Headers,
  {
    allowedRoles = ADMINISTRATIVE_ROLES,
    bearerSecret,
  }: AdministrativeAuthorizationOptions = {},
): Promise<AdministrativeAuthorization | null> {
  if (hasValidBearerAuthorization(headers.get('authorization'), bearerSecret)) {
    return { kind: 'service' }
  }

  const user = await authenticateRequestUser(payload, headers)
  if (!user || !userHasAnyRole(user, allowedRoles)) return null

  return { kind: 'user', user }
}

export function isSeedRouteEnabled(nodeEnv = process.env.NODE_ENV): boolean {
  return nodeEnv !== 'production'
}
