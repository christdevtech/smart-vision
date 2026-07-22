import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { adminFieldAccess, ownerOrAdmin } from '@/access/ownerAccess'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'user',
    group: 'Finance',
  },
  access: {
    create: admin,
    delete: admin,
    read: ownerOrAdmin('user'),
    update: admin,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
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
