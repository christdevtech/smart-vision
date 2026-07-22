import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { authenticated } from '@/access/authenticated'
import { adminFieldAccess } from '@/access/ownerAccess'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
  SubscriptFeature,
  SuperscriptFeature,
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
          return [
            ...rootFeatures,
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            SuperscriptFeature(),
            SubscriptFeature(),
          ]
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
      validate: (value) => {
        if (!Array.isArray(value)) return 'At least three options are required'
        const options = value as Array<{ isCorrect?: boolean; text?: string }>
        const correctOptions = options.filter((option) => option?.isCorrect === true)
        if (correctOptions.length !== 1) return 'Exactly one option must be marked correct'

        const normalizedTexts = options.map((option) =>
          String(option?.text ?? '')
            .trim()
            .toLowerCase(),
        )
        if (new Set(normalizedTexts).size !== normalizedTexts.length) {
          return 'Answer options must be unique'
        }

        return true
      },
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
          access: {
            read: adminFieldAccess,
          },
        },
      ],
    },
    {
      name: 'explanation',
      type: 'richText',
      access: {
        read: adminFieldAccess,
      },
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
