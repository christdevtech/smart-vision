import type { CollectionBeforeChangeHook } from 'payload'

const publicRegistrationDefaults = {
  isActive: true,
  onboarded: false,
  role: 'user',
} as const

export const enforcePublicUserDefaults: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation !== 'create' || req.user) return data

  delete data.lastActiveAt
  delete data.referredBy
  delete data.referralCode
  delete data.totalReferrals

  return {
    ...data,
    ...publicRegistrationDefaults,
  }
}
