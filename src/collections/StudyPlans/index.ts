import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { selfOrAdmin } from '@/access/selfOrAdmin'
import { authenticated } from '@/access/authenticated'

export const StudyPlans: CollectionConfig = {
  slug: 'study-plans',
  admin: {
    useAsTitle: 'user',
    group: 'User Content',
  },
  access: {
    create: authenticated,
    delete: selfOrAdmin,
    read: selfOrAdmin,
    update: selfOrAdmin,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // One plan per user
    },
    {
      name: 'goals',
      type: 'text',
    },
    {
      name: 'subjects',
      type: 'relationship',
      relationTo: 'subjects',
      hasMany: true,
    },
    {
      name: 'timetable',
      type: 'array',
      labels: { singular: 'Study Session', plural: 'Study Sessions' },
      fields: [
        {
          name: 'day',
          type: 'date',
        },
        {
          name: 'session',
          type: 'text',
        },
        {
          name: 'subject',
          type: 'relationship',
          relationTo: 'subjects',
        },
      ],
    },
    {
      name: 'progress',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Overall progress percentage (0-100)',
      },
    },
    {
      name: 'academicLevel',
      type: 'relationship',
      relationTo: 'academicLevels',
      required: true,
      admin: {
        description: 'Academic level for this study plan',
      },
    },
    {
      name: 'planType',
      type: 'select',
      options: [
        { label: 'Exam Preparation', value: 'exam_prep' },
        { label: 'Regular Study', value: 'regular_study' },
        { label: 'Revision', value: 'revision' },
        { label: 'Catch Up', value: 'catch_up' },
        { label: 'Advanced Learning', value: 'advanced' },
      ],
      defaultValue: 'regular_study',
      admin: {
        description: 'Type of study plan',
      },
    },
    {
      name: 'targetExamDate',
      type: 'date',
      admin: {
        condition: (data) => data.planType === 'exam_prep',
        description: 'Target exam date for exam preparation plans',
      },
    },
    {
      name: 'studyGoals',
      type: 'array',
      labels: { singular: 'Study Goal', plural: 'Study Goals' },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'subject',
          type: 'relationship',
          relationTo: 'subjects',
        },
        {
          name: 'targetDate',
          type: 'date',
        },
        {
          name: 'priority',
          type: 'select',
          options: [
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ],
          defaultValue: 'medium',
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Not Started', value: 'not_started' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Paused', value: 'paused' },
          ],
          defaultValue: 'not_started',
        },
        {
          name: 'progress',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Goal progress percentage (0-100)',
          },
        },
        {
          name: 'completedAt',
          type: 'date',
          admin: {
            condition: (data) => data.status === 'completed',
          },
        },
      ],
    },
    {
      name: 'weeklySchedule',
      type: 'array',
      labels: { singular: 'Weekly Session', plural: 'Weekly Schedule' },
      fields: [
        {
          name: 'dayOfWeek',
          type: 'select',
          options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' },
          ],
          required: true,
        },
        {
          name: 'startTime',
          type: 'text',
          required: true,
          admin: {
            description: 'Start time (e.g., 09:00)',
          },
        },
        {
          name: 'endTime',
          type: 'text',
          required: true,
          admin: {
            description: 'End time (e.g., 10:30)',
          },
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
          name: 'sessionType',
          type: 'select',
          options: [
            { label: 'Study', value: 'study' },
            { label: 'Practice', value: 'practice' },
            { label: 'Revision', value: 'revision' },
            { label: 'Test', value: 'test' },
          ],
          defaultValue: 'study',
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'milestones',
      type: 'array',
      labels: { singular: 'Milestone', plural: 'Milestones' },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'targetDate',
          type: 'date',
          required: true,
        },
        {
          name: 'subjects',
          type: 'relationship',
          relationTo: 'subjects',
          hasMany: true,
        },
        {
          name: 'isCompleted',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'completedAt',
          type: 'date',
          admin: {
            condition: (data) => data.isCompleted,
          },
        },
        {
          name: 'reward',
          type: 'text',
          admin: {
            description: 'Reward for completing this milestone',
          },
        },
      ],
    },
    {
      name: 'studyReminders',
      type: 'array',
      labels: { singular: 'Reminder', plural: 'Study Reminders' },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'message',
          type: 'textarea',
        },
        {
          name: 'reminderTime',
          type: 'date',
          required: true,
        },
        {
          name: 'reminderType',
          type: 'select',
          options: [
            { label: 'Study Session', value: 'study_session' },
            { label: 'Assignment Due', value: 'assignment_due' },
            { label: 'Exam Reminder', value: 'exam_reminder' },
            { label: 'Goal Deadline', value: 'goal_deadline' },
            { label: 'Custom', value: 'custom' },
          ],
          defaultValue: 'study_session',
        },
        {
          name: 'isRecurring',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'recurrencePattern',
          type: 'select',
          options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
          admin: {
            condition: (data) => data.isRecurring,
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'isSent',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'sentAt',
          type: 'date',
          admin: {
            readOnly: true,
            condition: (data) => data.isSent,
          },
        },
      ],
    },
    {
      name: 'studyPreferences',
      type: 'group',
      fields: [
        {
          name: 'preferredStudyTime',
          type: 'select',
          options: [
            { label: 'Early Morning (5-8 AM)', value: 'early_morning' },
            { label: 'Morning (8-12 PM)', value: 'morning' },
            { label: 'Afternoon (12-5 PM)', value: 'afternoon' },
            { label: 'Evening (5-8 PM)', value: 'evening' },
            { label: 'Night (8-11 PM)', value: 'night' },
            { label: 'Late Night (11 PM+)', value: 'late_night' },
          ],
        },
        {
          name: 'sessionDuration',
          type: 'number',
          defaultValue: 60,
          admin: {
            description: 'Preferred study session duration in minutes',
          },
        },
        {
          name: 'breakDuration',
          type: 'number',
          defaultValue: 15,
          admin: {
            description: 'Preferred break duration in minutes',
          },
        },
        {
          name: 'studyMethod',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Reading', value: 'reading' },
            { label: 'Video Learning', value: 'video' },
            { label: 'Practice Questions', value: 'practice' },
            { label: 'Note Taking', value: 'notes' },
            { label: 'Group Study', value: 'group' },
            { label: 'Flashcards', value: 'flashcards' },
          ],
        },
        {
          name: 'difficultyPreference',
          type: 'select',
          options: [
            { label: 'Start Easy', value: 'easy_first' },
            { label: 'Start Hard', value: 'hard_first' },
            { label: 'Mixed', value: 'mixed' },
          ],
          defaultValue: 'easy_first',
        },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      admin: {
        description: 'Study plan analytics and statistics',
      },
      fields: [
        {
          name: 'totalStudyHours',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total hours studied',
          },
        },
        {
          name: 'weeklyStudyHours',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Hours studied this week',
          },
        },
        {
          name: 'currentStreak',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Current study streak in days',
          },
        },
        {
          name: 'longestStreak',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Longest study streak in days',
          },
        },
        {
          name: 'completedGoals',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of completed goals',
          },
        },
        {
          name: 'completedMilestones',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of completed milestones',
          },
        },
        {
          name: 'averageSessionDuration',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Average study session duration in minutes',
          },
        },
        {
          name: 'lastStudySession',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'Last study session date',
          },
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether study plan is active',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'richText',
      admin: {
        description: 'Additional notes about the study plan',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        const now = new Date()
        
        if (operation === 'create') {
          data.createdAt = now
        }
        data.updatedAt = now
        
        return data
      },
    ],
  },
}
