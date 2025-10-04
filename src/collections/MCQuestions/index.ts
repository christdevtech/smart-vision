import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { authenticated } from '@/access/authenticated'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const MCQuestions: CollectionConfig = {
  slug: 'mcq',
  labels: {
    singular: 'Multiple Choice Question',
    plural: 'Multiple Choice Questions',
  },
  admin: {
    useAsTitle: 'question',
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
      name: 'question',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      required: true,
    },
    {
      name: 'options',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 5,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'isCorrect',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'explanation',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
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
      name: 'difficulty',
      type: 'select',
      options: ['easy', 'medium', 'hard'],
    },
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'topics',
      hasMany: true,
      filterOptions: ({ siblingData }: { siblingData: any }) => {
        if (!siblingData.subject) return false
        return {
          subjects: { contains: siblingData.subject },
        }
      },
    },
  ],
}
