import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'

export const Videos: CollectionConfig = {
  slug: 'videos',
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
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
    },
    {
      name: 'chapter',
      type: 'text',
      required: true,
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Duration in seconds',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'topics',
      hasMany: true,
      filterOptions: ({ siblingData }) => {
        if (!siblingData.subject) return false;
        return {
          subjects: { contains: siblingData.subject },
        };
      },
    },
  ],
}
