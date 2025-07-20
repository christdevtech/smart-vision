import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'

export const ExamPapers: CollectionConfig = {
  slug: 'exam-papers',
  admin: {
    useAsTitle: 'title',
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
    },
  ],
}
