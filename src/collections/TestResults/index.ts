import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { selfOrAdmin } from '@/access/selfOrAdmin'
import { authenticated } from '@/access/authenticated'

export const TestResults: CollectionConfig = {
  slug: 'test-results',
  labels: {
    singular: 'Test Result',
    plural: 'Test Results',
  },
  admin: {
    useAsTitle: 'user',
    group: 'User Content',
  },
  access: {
    create: authenticated,
    delete: admin,
    read: selfOrAdmin,
    update: authenticated,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'testType',
      type: 'select',
      options: [
        { label: 'Practice Test', value: 'practice' },
        { label: 'Timed Test', value: 'timed' },
        { label: 'Exam Paper', value: 'exam_paper' },
        { label: 'Topic Test', value: 'topic' },
        { label: 'Subject Test', value: 'subject' },
      ],
      required: true,
    },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
    },
    {
      name: 'topics',
      type: 'relationship',
      relationTo: 'topics',
      hasMany: true,
    },
    {
      name: 'academicLevel',
      type: 'relationship',
      relationTo: 'academicLevels',
      required: true,
    },
    {
      name: 'examPaper',
      type: 'relationship',
      relationTo: 'exam-papers',
      admin: {
        description: 'Reference to exam paper if this is an exam paper test',
      },
    },
    {
      name: 'questions',
      type: 'array',
      label: 'Test Questions and Answers',
      required: true,
      fields: [
        {
          name: 'question',
          type: 'relationship',
          relationTo: 'mcq',
          required: true,
        },
        {
          name: 'selectedAnswer',
          type: 'text',
          required: true,
          admin: {
            description: 'The option text that user selected',
          },
        },
        {
          name: 'correctAnswer',
          type: 'text',
          required: true,
          admin: {
            description: 'The correct option text',
          },
        },
        {
          name: 'isCorrect',
          type: 'checkbox',
          required: true,
        },
        {
          name: 'timeSpent',
          type: 'number',
          admin: {
            description: 'Time spent on this question in seconds',
          },
        },
        {
          name: 'difficulty',
          type: 'select',
          options: ['easy', 'medium', 'hard'],
        },
      ],
    },
    {
      name: 'totalQuestions',
      type: 'number',
      required: true,
    },
    {
      name: 'correctAnswers',
      type: 'number',
      required: true,
    },
    {
      name: 'incorrectAnswers',
      type: 'number',
      required: true,
    },
    {
      name: 'skippedQuestions',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'scorePercentage',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
    },
    {
      name: 'grade',
      type: 'select',
      options: [
        { label: 'A+', value: 'A+' },
        { label: 'A', value: 'A' },
        { label: 'B+', value: 'B+' },
        { label: 'B', value: 'B' },
        { label: 'C+', value: 'C+' },
        { label: 'C', value: 'C' },
        { label: 'D', value: 'D' },
        { label: 'F', value: 'F' },
      ],
    },
    {
      name: 'timeLimit',
      type: 'number',
      admin: {
        description: 'Time limit in minutes (null for untimed tests)',
      },
    },
    {
      name: 'timeUsed',
      type: 'number',
      required: true,
      admin: {
        description: 'Actual time used in minutes',
      },
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'completedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'isCompleted',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'attemptNumber',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Which attempt this is for the same test/content',
      },
    },
    {
      name: 'weakAreas',
      type: 'array',
      label: 'Identified Weak Areas',
      fields: [
        {
          name: 'topic',
          type: 'relationship',
          relationTo: 'topics',
        },
        {
          name: 'accuracy',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Accuracy percentage for this topic',
          },
        },
      ],
    },
    {
      name: 'strongAreas',
      type: 'array',
      label: 'Identified Strong Areas',
      fields: [
        {
          name: 'topic',
          type: 'relationship',
          relationTo: 'topics',
        },
        {
          name: 'accuracy',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Accuracy percentage for this topic',
          },
        },
      ],
    },
    {
      name: 'reviewMode',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether user has reviewed incorrect answers',
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'User notes about this test attempt',
      },
    },
  ],
  indexes: [
    {
      fields: ['user', 'completedAt'],
    },
    {
      fields: ['user', 'subject', 'scorePercentage'],
    },
    {
      fields: ['testType', 'academicLevel'],
    },
  ],
  timestamps: true,
}
