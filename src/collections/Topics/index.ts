import { admin } from '@/access/admin'
import { anyone } from '@/access/anyone'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const Topics: CollectionConfig = {
  slug: 'topics',
  labels: {
    singular: 'Topic',
    plural: 'Topics',
  },
  admin: {
    useAsTitle: 'name',
  },
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
      unique: true,
    },
    {
      name: 'subjects',
      type: 'relationship',
      relationTo: 'subjects',
      hasMany: true,
      required: true,
    },
    ...slugField('name'),
  ],
}
