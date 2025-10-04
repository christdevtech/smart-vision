import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { selfOrAdmin } from '@/access/selfOrAdmin'

export const Notifications: CollectionConfig<'notifications'> = {
  slug: 'notifications',
  labels: {
    singular: 'Notification',
    plural: 'Notifications',
  },
  admin: {
    useAsTitle: 'title',
    group: 'User Content',
    description: 'Manage user notifications and push notifications for mobile app',
    defaultColumns: ['title', 'recipient', 'type', 'isRead', 'createdAt'],
  },
  access: {
    create: admin,
    delete: admin,
    read: selfOrAdmin,
    update: selfOrAdmin,
  },
  indexes: [
    {
      fields: ['recipient', 'isRead'],
    },
    {
      fields: ['recipient', 'createdAt'],
    },
    {
      fields: ['type', 'priority'],
    },
    {
      fields: ['scheduledFor'],
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Notification title/subject',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: 500,
      admin: {
        description: 'Notification message content',
      },
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who will receive this notification',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'System', value: 'system' },
        { label: 'Payment', value: 'payment' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Content', value: 'content' },
        { label: 'Achievement', value: 'achievement' },
        { label: 'Reminder', value: 'reminder' },
        { label: 'Referral', value: 'referral' },
        { label: 'Study Plan', value: 'study_plan' },
        { label: 'Test Result', value: 'test_result' },
        { label: 'General', value: 'general' },
      ],
      required: true,
      defaultValue: 'general',
      admin: {
        description: 'Category of notification for filtering and styling',
      },
    },
    {
      name: 'priority',
      type: 'select',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
      required: true,
      defaultValue: 'normal',
      admin: {
        description: 'Priority level affects display order and styling',
      },
    },
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the user has read this notification',
        position: 'sidebar',
      },
    },
    {
      name: 'readAt',
      type: 'date',
      admin: {
        description: 'Timestamp when notification was marked as read',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'actionLink',
      type: 'text',
      admin: {
        description:
          'Optional URL where user can take action or see details (e.g., /dashboard/subscription)',
      },
    },
    {
      name: 'actionLabel',
      type: 'text',
      maxLength: 50,
      admin: {
        description: 'Label for the action button (e.g., "View Details", "Complete Payment")',
        condition: (data) => Boolean(data.actionLink),
      },
    },
    {
      name: 'scheduledFor',
      type: 'date',
      admin: {
        description: 'Optional: Schedule notification for future delivery',
        position: 'sidebar',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'Optional: When this notification should be automatically hidden',
        position: 'sidebar',
      },
    },
    // Mobile Push Notification Fields
    {
      name: 'pushNotification',
      type: 'group',
      label: 'Push Notification Settings',
      admin: {
        description: 'Settings for mobile push notifications',
      },
      fields: [
        {
          name: 'sendPush',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Send as push notification to mobile devices',
          },
        },
        {
          name: 'pushSent',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether push notification was successfully sent',
            readOnly: true,
          },
        },
        {
          name: 'pushSentAt',
          type: 'date',
          admin: {
            description: 'When push notification was sent',
            readOnly: true,
          },
        },
        {
          name: 'pushError',
          type: 'text',
          admin: {
            description: 'Error message if push notification failed',
            readOnly: true,
          },
        },
        {
          name: 'sound',
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Silent', value: 'silent' },
            { label: 'Achievement', value: 'achievement' },
            { label: 'Alert', value: 'alert' },
          ],
          defaultValue: 'default',
          admin: {
            description: 'Sound to play with push notification',
          },
        },
        {
          name: 'badge',
          type: 'number',
          admin: {
            description: 'Badge count to display on app icon',
          },
        },
        {
          name: 'data',
          type: 'json',
          admin: {
            description: 'Additional data to send with push notification (JSON format)',
          },
        },
      ],
    },
    // Metadata
    {
      name: 'metadata',
      type: 'group',
      label: 'Metadata',
      admin: {
        description: 'Additional notification metadata',
      },
      fields: [
        {
          name: 'relatedContentType',
          type: 'select',
          options: [
            { label: 'Video', value: 'videos' },
            { label: 'Book', value: 'books' },
            { label: 'Exam Paper', value: 'exam-papers' },
            { label: 'MCQ Question', value: 'mcquestions' },
            { label: 'Study Plan', value: 'study-plans' },
            { label: 'Test Result', value: 'test-results' },
            { label: 'Subscription', value: 'subscriptions' },
            { label: 'Transaction', value: 'transactions' },
          ],
          admin: {
            description: 'Type of content this notification relates to',
          },
        },
        {
          name: 'relatedContentId',
          type: 'text',
          admin: {
            description: 'ID of the related content item',
          },
        },
        {
          name: 'source',
          type: 'select',
          options: [
            { label: 'System', value: 'system' },
            { label: 'Admin', value: 'admin' },
            { label: 'Automated', value: 'automated' },
            { label: 'API', value: 'api' },
          ],
          defaultValue: 'system',
          admin: {
            description: 'Source that generated this notification',
          },
        },
        {
          name: 'tags',
          type: 'array',
          maxRows: 5,
          fields: [
            {
              name: 'tag',
              type: 'text',
              required: true,
            },
          ],
          admin: {
            description: 'Tags for categorization and filtering',
          },
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this notification is active and should be displayed',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Set readAt timestamp when isRead is set to true
        if (data.isRead && !data.readAt) {
          data.readAt = new Date().toISOString()
        }

        // Clear readAt if isRead is set to false
        if (!data.isRead && data.readAt) {
          data.readAt = null
        }

        return data
      },
    ],
    afterChange: [
      ({ doc, operation }) => {
        // Here you can add logic to trigger push notifications
        // when a notification is created with sendPush: true
        if (operation === 'create' && doc.pushNotification?.sendPush) {
          // TODO: Implement push notification sending logic
          console.log(`Push notification should be sent for: ${doc.title}`)
        }
      },
    ],
  },
}
