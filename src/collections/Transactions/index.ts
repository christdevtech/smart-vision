import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { selfOrAdmin } from '@/access/selfOrAdmin'
import { readTransactions } from '@/access/transactionAccess'
import {
  determineSubscriptionPlan,
  findOrCreateUserSubscription,
  getSubscriptionCosts,
} from '@/utilities/subscription'
import { updateSubscriptions } from './hooks/updateSubscriptions'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  labels: {
    singular: 'Transaction',
    plural: 'Transactions',
  },
  admin: {
    useAsTitle: 'transactionId',
    group: 'Finance',
  },
  access: {
    create: admin,
    delete: admin,
    read: readTransactions,
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
    },
    {
      name: 'transactionId',
      type: 'text',
      required: true,
      // unique: true,
    },
    {
      name: 'fapshiTransId',
      type: 'text',
      label: 'Fapshi Transaction ID',
      admin: {
        description: 'Transaction ID from Fapshi (e.g., fp_1234567890)',
      },
    },
    {
      name: 'externalId',
      type: 'text',
      label: 'External ID',
      admin: {
        description: 'Your system order/transaction ID for reconciliation',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'revenue',
      type: 'number',
      label: 'Revenue (After Fees)',
      admin: {
        description: 'Amount received after Fapshi fees deduction',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Created', value: 'created' },
        { label: 'Pending', value: 'pending' },
        { label: 'Successful', value: 'successful' },
        { label: 'Failed', value: 'failed' },
        { label: 'Expired', value: 'expired' },
        { label: 'Refunded', value: 'refunded' },
      ],
      defaultValue: 'created',
    },
    {
      name: 'paymentMedium',
      type: 'select',
      options: [
        { label: 'Mobile Money', value: 'mobile money' },
        { label: 'Orange Money', value: 'orange money' },
      ],
      admin: {
        description: 'Payment method used',
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
      admin: {
        description: 'Phone number used for payment',
      },
    },
    {
      name: 'financialTransId',
      type: 'text',
      label: 'Financial Transaction ID',
      admin: {
        description: 'Transaction ID from the mobile money operator',
      },
    },
    {
      name: 'dateInitiated',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'dateConfirmed',
      type: 'date',
      admin: {
        description: 'Date when payment was confirmed',
      },
    },
    {
      name: 'webhookReceived',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether webhook notification was received',
      },
    },
    {
      name: 'webhookReceivedAt',
      type: 'date',
      admin: {
        description: 'Timestamp when webhook was received',
      },
    },
    {
      name: 'lastStatusCheck',
      type: 'date',
      admin: {
        description: 'Last time status was checked via API',
      },
    },
    {
      name: 'statusCheckCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times status was checked',
      },
    },
    {
      name: 'reconciled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether transaction has been reconciled',
      },
    },
    {
      name: 'reconciledAt',
      type: 'date',
      admin: {
        description: 'Date when transaction was reconciled',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes or error messages',
      },
    },
  ],
  hooks: {
    afterChange: [updateSubscriptions],
  },
}
