import type { Access, FieldAccess } from 'payload'

export const isAdminUser = (user: { role?: string } | null | undefined): boolean =>
  Boolean(user && ['admin', 'super-admin'].includes(user.role ?? ''))

export const ownerOrAdmin = (ownerField: string): Access => {
  return ({ req: { user } }) => {
    if (!user) return false
    if (isAdminUser(user)) return true

    return {
      [ownerField]: {
        equals: user.id,
      },
    }
  }
}

export const adminFieldAccess: FieldAccess = ({ req: { user } }) => isAdminUser(user)
