import { admin } from '@/access/admin'
import { anyone } from '@/access/anyone'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const Subjects: CollectionConfig = {
  slug: 'subjects',
  access: {
    create: admin,
    read: anyone,
    delete: admin,
    update: admin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    ...slugField('name'),
  ],
}
