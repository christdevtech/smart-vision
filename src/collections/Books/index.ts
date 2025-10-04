import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'

export const Books: CollectionConfig = {
  slug: 'books',
  admin: {
    useAsTitle: 'title',
    group: 'Platform Content',
  },
  access: {
    create: admin,
    delete: admin,
    read: authenticated,
    update: admin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField('title'),
    {
      name: 'academicLevel',
      type: 'relationship',
      relationTo: 'academicLevels',
      required: true,
    },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'pdf',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'author',
      type: 'text',
      admin: {
        description: 'Book author(s)',
      },
    },
    {
      name: 'isbn',
      type: 'text',
      admin: {
        description: 'ISBN number',
      },
    },
    {
      name: 'pageCount',
      type: 'number',
      admin: {
        description: 'Total number of pages',
      },
    },
    {
      name: 'subscriptionRequired',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether subscription is required to access this book',
      },
    },
    {
      name: 'subscriptionTiers',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annual', value: 'annual' },
      ],
      defaultValue: ['monthly', 'annual'],
      admin: {
        description: 'Which subscription tiers can access this book',
        condition: (data) => data.subscriptionRequired,
      },
    },
    {
      name: 'isProtected',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether PDF has DRM protection',
      },
    },

    {
      name: 'allowPrint',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether book can be printed',
      },
    },
    {
      name: 'allowCopy',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether text can be copied from the book',
      },
    },
    {
      name: 'watermarkText',
      type: 'text',
      admin: {
        description: 'Watermark text to overlay on PDF pages',
      },
    },
    {
      name: 'encryptionKey',
      type: 'text',
      admin: {
        description: 'Encryption key for content protection',
        readOnly: true,
      },
    },
    {
      name: 'fileSize',
      type: 'number',
      admin: {
        description: 'File size in bytes',
        readOnly: true,
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether book is active and accessible',
      },
    },

    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Total number of views',
      },
    },
    {
      name: 'lastAccessed',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last time book was accessed',
      },
    },
  ],
}
