import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'

export const ExamPapers: CollectionConfig = {
  slug: 'exam-papers',
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
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'paperType',
      type: 'select',
      options: [
        { label: 'Paper 1', value: '1' },
        { label: 'Paper 2', value: '2' },
        { label: 'Paper 3', value: '3' },
      ],
      required: true,
    },
    {
      name: 'pdf',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Description of the exam paper',
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Exam duration in minutes',
      },
    },
    {
      name: 'totalMarks',
      type: 'number',
      admin: {
        description: 'Total marks for the exam',
      },
    },
    {
      name: 'subscriptionRequired',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether subscription is required to access this exam paper',
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
        description: 'Which subscription tiers can access this exam paper',
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
        description: 'Whether exam paper can be printed',
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
      name: 'hasAnswerKey',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether answer key is available',
      },
    },
    {
      name: 'answerKeyPdf',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data.hasAnswerKey,
        description: 'Answer key PDF file',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether exam paper is active and accessible',
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
        description: 'Last time exam paper was accessed',
      },
    },
  ],
}
