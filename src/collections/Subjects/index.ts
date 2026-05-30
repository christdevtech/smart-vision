import { admin } from '@/access/admin'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'
import { readSubjects } from './access/readSubjects'

export const Subjects: CollectionConfig = {
  slug: 'subjects',
  admin: {
    useAsTitle: 'name',
    group: 'Categories',
  },
  access: {
    create: admin,
    read: readSubjects,
    delete: admin,
    update: admin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'academicLevels',
      type: 'relationship',
      relationTo: 'academicLevels',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    ...slugField('name'),
  ],
}
