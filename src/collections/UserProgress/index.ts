import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { selfOrAdmin } from '@/access/selfOrAdmin'
import { authenticated } from '@/access/authenticated'

export const UserProgress: CollectionConfig = {
  slug: 'user-progress',
  labels: {
    singular: 'User Progress',
    plural: 'User Progress',
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
      name: 'contentType',
      type: 'select',
      options: [
        { label: 'MCQ Test', value: 'mcq' },
        { label: 'Video', value: 'video' },
        { label: 'Book/PDF', value: 'book' },
        { label: 'Exam Paper', value: 'exam-paper' },
        { label: 'Study Plan', value: 'study-plan' },
      ],
      required: true,
    },
    {
      name: 'contentId',
      type: 'text',
      required: true,
      admin: {
        description: 'ID of the content item (video, book, mcq, etc.)',
      },
    },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
    },
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'topics',
      hasMany: true,
    },
    {
      name: 'academicLevel',
      type: 'relationship',
      relationTo: 'academicLevels',
    },
    {
      name: 'progressPercentage',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 0,
      admin: {
        description: 'Progress percentage (0-100)',
      },
    },
    {
      name: 'timeSpent',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Time spent in minutes',
      },
    },
    {
      name: 'lastAccessed',
      type: 'date',
      defaultValue: () => new Date(),
    },
    {
      name: 'completed',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'completedAt',
      type: 'date',
    },
    {
      name: 'score',
      type: 'number',
      admin: {
        description: 'Score for tests/assessments (percentage)',
      },
    },
    {
      name: 'attempts',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Number of attempts for this content',
      },
    },
    {
      name: 'bookmarks',
      type: 'array',
      label: 'Bookmarks/Annotations',
      fields: [
        {
          name: 'position',
          type: 'text',
          admin: {
            description: 'Page number, timestamp, or position marker',
          },
        },
        {
          name: 'note',
          type: 'textarea',
        },
        {
          name: 'createdAt',
          type: 'date',
          defaultValue: () => new Date(),
        },
      ],
    },
    {
      name: 'studyStreak',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Current study streak in days',
      },
    },
    {
      name: 'achievements',
      type: 'array',
      label: 'Achievements Earned',
      fields: [
        {
          name: 'achievementType',
          type: 'select',
          options: [
            { label: 'First Test Completed', value: 'first_test' },
            { label: 'Perfect Score', value: 'perfect_score' },
            { label: 'Study Streak', value: 'study_streak' },
            { label: 'Content Master', value: 'content_master' },
            { label: 'Early Bird', value: 'early_bird' },
            { label: 'Night Owl', value: 'night_owl' },
          ],
        },
        {
          name: 'earnedAt',
          type: 'date',
          defaultValue: () => new Date(),
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
  ],
  indexes: [
    {
      unique: true,
      fields: ['user', 'contentType', 'contentId'],
    },
    {
      fields: ['user', 'lastAccessed'],
    },
  ],
  timestamps: true,
}
