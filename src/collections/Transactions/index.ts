import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { selfOrAdmin } from '@/access/selfOrAdmin'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'transactionId',
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
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      required: true,
    },
    {
      name: 'transactionId',
      type: 'text',
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['pending', 'paid', 'failed', 'refunded'],
      defaultValue: 'pending',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
  ],
}
