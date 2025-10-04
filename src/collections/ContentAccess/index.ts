import { CollectionConfig } from 'payload'
import { admin } from '@/access/admin'
import { authenticated } from '@/access/authenticated'

export const ContentAccess: CollectionConfig = {
  slug: 'content-access',
  admin: {
    useAsTitle: 'id',
    group: 'Access Control',
    description: 'Manages subscription-based access control for content',
  },
  access: {
    create: admin,
    delete: admin,
    read: authenticated,
    update: admin,
  },
  indexes: [
    {
      fields: ['user', 'contentType', 'contentId'],
      unique: true,
    },
    {
      fields: ['user', 'accessGranted'],
    },
    {
      fields: ['contentType', 'contentId'],
    },
    {
      fields: ['expiresAt'],
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User requesting access',
      },
    },
    {
      name: 'contentType',
      type: 'select',
      options: [
        { label: 'Video', value: 'videos' },
        { label: 'Book', value: 'books' },
        { label: 'Exam Paper', value: 'exam-papers' },
        { label: 'MCQ Question', value: 'mcquestions' },
      ],
      required: true,
      admin: {
        description: 'Type of content being accessed',
      },
    },
    {
      name: 'contentId',
      type: 'text',
      required: true,
      admin: {
        description: 'ID of the specific content item',
      },
    },
    {
      name: 'contentTitle',
      type: 'text',
      admin: {
        description: 'Title of the content for reference',
      },
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      required: true,
      admin: {
        description: 'User subscription used for access',
      },
    },
    {
      name: 'accessGranted',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether access is granted',
      },
    },
    {
      name: 'accessReason',
      type: 'select',
      options: [
        { label: 'Valid Subscription', value: 'valid_subscription' },
        { label: 'Free Content', value: 'free_content' },
        { label: 'Trial Access', value: 'trial_access' },
        { label: 'Admin Override', value: 'admin_override' },
        { label: 'Promotional Access', value: 'promotional_access' },
      ],
      admin: {
        description: 'Reason for access grant/denial',
      },
    },
    {
      name: 'accessDeniedReason',
      type: 'select',
      options: [
        { label: 'No Active Subscription', value: 'no_subscription' },
        { label: 'Subscription Expired', value: 'subscription_expired' },
        { label: 'Insufficient Subscription Tier', value: 'insufficient_tier' },
        { label: 'Content Not Available', value: 'content_unavailable' },
        { label: 'Geographic Restriction', value: 'geo_restricted' },
        { label: 'Account Suspended', value: 'account_suspended' },
      ],
      admin: {
        condition: (data) => !data.accessGranted,
        description: 'Reason for access denial',
      },
    },
    {
      name: 'requiredSubscriptionTier',
      type: 'select',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annual', value: 'annual' },
      ],
      admin: {
        description: 'Minimum subscription tier required',
      },
    },
    {
      name: 'userSubscriptionTier',
      type: 'select',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annual', value: 'annual' },
      ],
      admin: {
        description: 'User current subscription tier',
      },
    },
    {
      name: 'accessAttempts',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Number of access attempts',
      },
    },
    {
      name: 'firstAccessAt',
      type: 'date',
      admin: {
        description: 'First time access was attempted',
      },
    },
    {
      name: 'lastAccessAt',
      type: 'date',
      admin: {
        description: 'Last time access was attempted',
      },
    },
    {
      name: 'grantedAt',
      type: 'date',
      admin: {
        condition: (data) => data.accessGranted,
        description: 'When access was granted',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        condition: (data) => data.accessGranted,
        description: 'When access expires',
      },
    },
    {
      name: 'deviceInfo',
      type: 'group',
      fields: [
        {
          name: 'deviceId',
          type: 'text',
          admin: {
            description: 'Device identifier',
          },
        },
        {
          name: 'deviceType',
          type: 'select',
          options: [
            { label: 'Mobile', value: 'mobile' },
            { label: 'Tablet', value: 'tablet' },
            { label: 'Desktop', value: 'desktop' },
            { label: 'Unknown', value: 'unknown' },
          ],
        },
        {
          name: 'platform',
          type: 'text',
          admin: {
            description: 'Operating system/platform',
          },
        },
        {
          name: 'userAgent',
          type: 'text',
          admin: {
            description: 'Browser user agent',
          },
        },
        {
          name: 'ipAddress',
          type: 'text',
          admin: {
            description: 'IP address of access attempt',
          },
        },
      ],
    },

    {
      name: 'printAllowed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether content can be printed',
      },
    },
    {
      name: 'copyAllowed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether content can be copied',
      },
    },
    {
      name: 'maxConcurrentSessions',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Maximum concurrent sessions allowed',
      },
    },
    {
      name: 'currentSessions',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Current active sessions',
      },
    },
    {
      name: 'sessionToken',
      type: 'text',
      admin: {
        description: 'Unique session token for access tracking',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether access record is active',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes about access',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        const now = new Date()
        
        if (operation === 'create') {
          data.firstAccessAt = now
          data.lastAccessAt = now
          
          // Generate session token
          data.sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        } else {
          data.lastAccessAt = now
        }
        
        // Set granted timestamp
        if (data.accessGranted && !data.grantedAt) {
          data.grantedAt = now
        }
        
        return data
      },
    ],
  },
}