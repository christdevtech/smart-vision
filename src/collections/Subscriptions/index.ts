import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { selfOrAdmin } from '@/access/selfOrAdmin'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'user',
  },
  access: {
    create: admin,
    delete: admin,
    read: selfOrAdmin,
    update: admin,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // One active subscription per user
    },
    {
      name: 'plan',
      type: 'select',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annual', value: 'annual' },
      ],
      required: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
    },
    {
      name: 'paymentStatus',
      type: 'select',
      options: ['pending', 'paid', 'failed', 'expired'],
      defaultValue: 'pending',
    },
    {
      name: 'transactions',
      type: 'relationship',
      relationTo: 'transactions',
      hasMany: true,
    },
  ],
}