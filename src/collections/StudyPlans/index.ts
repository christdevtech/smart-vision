import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { selfOrAdmin } from '@/access/selfOrAdmin'
import { authenticated } from '@/access/authenticated'

export const StudyPlans: CollectionConfig = {
  slug: 'study-plans',
  admin: {
    useAsTitle: 'user',
  },
  access: {
    create: authenticated,
    delete: selfOrAdmin,
    read: selfOrAdmin,
    update: selfOrAdmin,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // One plan per user
    },
    {
      name: 'goals',
      type: 'text',
    },
    {
      name: 'subjects',
      type: 'relationship',
      relationTo: 'subjects',
      hasMany: true,
    },
    {
      name: 'timetable',
      type: 'array',
      fields: [
        {
          name: 'day',
          type: 'date',
        },
        {
          name: 'session',
          type: 'text',
        },
        {
          name: 'subject',
          type: 'relationship',
          relationTo: 'subjects',
        },
      ],
    },
    {
      name: 'progress',
      type: 'number',
      defaultValue: 0,
    },
  ],
}