import type { Access, CollectionConfig } from 'payload'

const canReadReward: Access = ({ req: { user } }) => {
  if (!user) return false
  if (['admin', 'super-admin'].includes(user.role)) return true
  return { referrer: { equals: user.id } }
}

const denyMutation: Access = () => false

export const ReferralRewards: CollectionConfig = {
  slug: 'referral-rewards',
  labels: {
    singular: 'Referral Reward',
    plural: 'Referral Rewards',
  },
  admin: {
    group: 'Referrals & Rewards',
    useAsTitle: 'idempotencyKey',
    defaultColumns: [
      'referrer',
      'referredUser',
      'grossPaymentAmount',
      'rewardAmount',
      'status',
      'settledAt',
    ],
  },
  access: {
    create: denyMutation,
    delete: denyMutation,
    read: canReadReward,
    update: denyMutation,
  },
  fields: [
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
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
      index: true,
    },
    {
      name: 'attribution',
      type: 'relationship',
      relationTo: 'referral-attributions',
    },
    {
      name: 'paymentSettlement',
      type: 'relationship',
      relationTo: 'payment-settlements',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'transaction',
      type: 'relationship',
      relationTo: 'transactions',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'referrerSubscription',
      type: 'relationship',
      relationTo: 'subscriptions',
    },
    {
      name: 'plan',
      type: 'select',
      options: ['monthly', 'annual'],
      required: true,
    },
    {
      name: 'grossPaymentAmount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'providerFeeAmount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'providerFeeRateBasisPoints',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'revenue',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'rewardRateBasisPoints',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'rewardAmount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'platformRevenueAfterReward',
      type: 'number',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['available', 'ineligible', 'paid', 'reversed'],
      required: true,
      index: true,
    },
    {
      name: 'ineligibilityReason',
      type: 'select',
      options: [
        'program-disabled',
        'self-referral',
        'referrer-inactive',
        'referrer-subscription-inactive',
      ],
      admin: {
        condition: (_, siblingData) => siblingData.status === 'ineligible',
      },
    },
    {
      name: 'settledAt',
      type: 'date',
      required: true,
    },
    {
      name: 'reversedAt',
      type: 'date',
    },
    {
      name: 'reversalReason',
      type: 'text',
    },
  ],
  indexes: [
    {
      fields: ['referrer', 'status', 'settledAt'],
    },
    {
      fields: ['referredUser', 'settledAt'],
    },
  ],
  timestamps: true,
}
