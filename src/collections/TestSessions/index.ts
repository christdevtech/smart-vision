import { admin } from '@/access/admin'
import { ownerOrAdmin } from '@/access/ownerAccess'
import type { CollectionConfig } from 'payload'

export const TestSessions: CollectionConfig = {
  slug: 'test-sessions',
  labels: {
    singular: 'Test Session',
    plural: 'Test Sessions',
  },
  admin: {
    group: 'User Content',
    useAsTitle: 'id',
    defaultColumns: ['user', 'subject', 'status', 'startedAt', 'expiresAt'],
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
      index: true,
    },
    {
      name: 'testType',
      type: 'select',
      options: [{ label: 'Practice Test', value: 'practice' }],
      defaultValue: 'practice',
      required: true,
    },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
    },
    {
      name: 'topics',
      type: 'relationship',
      relationTo: 'topics',
      hasMany: true,
    },
    {
      name: 'academicLevel',
      type: 'relationship',
      relationTo: 'academicLevels',
      required: true,
    },
    {
      name: 'difficulty',
      type: 'select',
      options: ['easy', 'medium', 'hard'],
    },
    {
      name: 'questions',
      type: 'relationship',
      relationTo: 'mcq',
      hasMany: true,
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Expired', value: 'expired' },
      ],
      defaultValue: 'active',
      required: true,
      index: true,
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'completedAt',
      type: 'date',
    },
    {
      name: 'result',
      type: 'relationship',
      relationTo: 'test-results',
    },
  ],
  indexes: [
    { fields: ['user', 'status', 'expiresAt'] },
    { fields: ['user', 'subject', 'startedAt'] },
  ],
  timestamps: true,
}
