import { admin } from '@/access/admin'
import { anyone } from '@/access/anyone'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const AcademicLevels: CollectionConfig = {
  slug: 'academicLevels',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: admin,
    delete: admin,
    read: anyone,
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
