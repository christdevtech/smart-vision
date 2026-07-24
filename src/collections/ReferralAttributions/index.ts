import type { Access, CollectionConfig } from 'payload'

const canReadAttribution: Access = ({ req: { user } }) => {
  if (!user) return false
  if (['admin', 'super-admin'].includes(user.role)) return true
  return { referrer: { equals: user.id } }
}

const denyMutation: Access = () => false

export const ReferralAttributions: CollectionConfig = {
  slug: 'referral-attributions',
  labels: {
    singular: 'Referral Attribution',
    plural: 'Referral Attributions',
  },
  admin: {
    group: 'Referrals & Rewards',
    useAsTitle: 'referralCode',
    defaultColumns: ['referrer', 'referredUser', 'referralCode', 'status', 'attributedAt'],
  },
  access: {
    create: denyMutation,
    delete: denyMutation,
    read: canReadAttribution,
    update: denyMutation,
  },
  fields: [
    {
      name: 'referrer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'referredUser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'referralCode',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'attributedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'source',
      type: 'select',
      options: ['signed-cookie', 'legacy', 'admin'],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['valid', 'legacy-unverified', 'invalidated'],
      defaultValue: 'valid',
      required: true,
    },
    {
      name: 'tokenId',
      type: 'text',
      admin: {
        description: 'Non-secret token nonce used for attribution auditing.',
      },
    },
    {
      name: 'invalidReason',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.status === 'invalidated',
      },
    },
  ],
  indexes: [
    {
      fields: ['referrer', 'attributedAt'],
    },
  ],
  timestamps: true,
}
