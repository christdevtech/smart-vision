import type { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { applyPaymentSettlement } from './hooks/applyPaymentSettlement'

const denyMutation = () => false

export const PaymentSettlements: CollectionConfig = {
  slug: 'payment-settlements',
  labels: {
    singular: 'Payment Settlement',
    plural: 'Payment Settlements',
  },
  admin: {
    group: 'Finance',
    useAsTitle: 'providerTransactionId',
    defaultColumns: ['providerTransactionId', 'user', 'amount', 'plan', 'verifiedAt'],
  },
  access: {
    create: denyMutation,
    delete: denyMutation,
    read: admin,
    update: denyMutation,
  },
  fields: [
    {
      name: 'transaction',
      type: 'relationship',
      relationTo: 'transactions',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'providerTransactionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'externalId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'plan',
      type: 'select',
      options: ['monthly', 'annual'],
      required: true,
    },
    {
      name: 'revenue',
      type: 'number',
    },
    {
      name: 'paymentMedium',
      type: 'select',
      options: ['mobile money', 'orange money'],
    },
    {
      name: 'financialTransId',
      type: 'text',
    },
    {
      name: 'providerConfirmedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'verifiedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'source',
      type: 'select',
      options: ['webhook', 'manual', 'batch', 'reconciliation'],
      required: true,
    },
  ],
  hooks: {
    afterChange: [applyPaymentSettlement],
  },
}
