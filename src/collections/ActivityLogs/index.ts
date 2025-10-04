import { CollectionConfig } from 'payload'
import { admin, superAdmin } from '@/access/admin'
import { authenticated } from '@/access/authenticated'

export const ActivityLogs: CollectionConfig = {
  slug: 'activity-logs',
  labels: {
    singular: 'Activity Log',
    plural: 'Activity Logs',
  },
  admin: {
    useAsTitle: 'action',
    group: 'Analytics & Audit',
    description: 'Platform activity logs for analytics and auditing',
    defaultColumns: ['action', 'user', 'userType', 'timestamp', 'ipAddress'],
    pagination: {
      defaultLimit: 50,
    },
  },
  access: {
    create: authenticated, // Allow authenticated users to create logs
    delete: superAdmin, // Only super admins can delete logs
    read: admin, // Only admins can read logs for privacy
    update: superAdmin, // Only super admins can update logs
  },
  indexes: [
    {
      fields: ['user', 'timestamp'],
    },
    {
      fields: ['action', 'timestamp'],
    },
    {
      fields: ['userType', 'timestamp'],
    },
    {
      fields: ['category', 'timestamp'],
    },
    {
      fields: ['timestamp'],
    },
    {
      fields: ['ipAddress'],
    },
  ],
  fields: [
    {
      name: 'action',
      type: 'select',
      options: [
        // Authentication Actions
        { label: 'User Login', value: 'auth.login' },
        { label: 'User Logout', value: 'auth.logout' },
        { label: 'User Registration', value: 'auth.register' },
        { label: 'Password Reset Request', value: 'auth.password_reset_request' },
        { label: 'Password Reset Complete', value: 'auth.password_reset_complete' },
        { label: 'Account Activation', value: 'auth.account_activation' },
        { label: 'Account Deactivation', value: 'auth.account_deactivation' },
        
        // Content Actions
        { label: 'Video Viewed', value: 'content.video_viewed' },
        { label: 'Video Started', value: 'content.video_started' },
        { label: 'Video Completed', value: 'content.video_completed' },
        { label: 'Book Downloaded', value: 'content.book_downloaded' },
        { label: 'Book Opened', value: 'content.book_opened' },
        { label: 'Exam Paper Downloaded', value: 'content.exam_paper_downloaded' },
        { label: 'MCQ Test Started', value: 'content.mcq_test_started' },
        { label: 'MCQ Test Completed', value: 'content.mcq_test_completed' },
        { label: 'Content Search', value: 'content.search' },
        { label: 'Content Access Denied', value: 'content.access_denied' },
        
        // User Profile Actions
        { label: 'Profile Updated', value: 'profile.updated' },
        { label: 'Profile Picture Changed', value: 'profile.picture_changed' },
        { label: 'Academic Level Changed', value: 'profile.academic_level_changed' },
        { label: 'Phone Number Updated', value: 'profile.phone_updated' },
        
        // Subscription Actions
        { label: 'Subscription Purchased', value: 'subscription.purchased' },
        { label: 'Subscription Renewed', value: 'subscription.renewed' },
        { label: 'Subscription Cancelled', value: 'subscription.cancelled' },
        { label: 'Subscription Expired', value: 'subscription.expired' },
        { label: 'Payment Initiated', value: 'payment.initiated' },
        { label: 'Payment Completed', value: 'payment.completed' },
        { label: 'Payment Failed', value: 'payment.failed' },
        
        // Study Plan Actions
        { label: 'Study Plan Created', value: 'study_plan.created' },
        { label: 'Study Plan Updated', value: 'study_plan.updated' },
        { label: 'Study Plan Deleted', value: 'study_plan.deleted' },
        { label: 'Study Session Completed', value: 'study_plan.session_completed' },
        
        // Referral Actions
        { label: 'Referral Code Generated', value: 'referral.code_generated' },
        { label: 'Referral Link Shared', value: 'referral.link_shared' },
        { label: 'Referral Successful', value: 'referral.successful' },
        { label: 'Referral Reward Earned', value: 'referral.reward_earned' },
        
        // Admin Actions
        { label: 'User Created by Admin', value: 'admin.user_created' },
        { label: 'User Updated by Admin', value: 'admin.user_updated' },
        { label: 'User Deleted by Admin', value: 'admin.user_deleted' },
        { label: 'Content Created by Admin', value: 'admin.content_created' },
        { label: 'Content Updated by Admin', value: 'admin.content_updated' },
        { label: 'Content Deleted by Admin', value: 'admin.content_deleted' },
        { label: 'Subscription Modified by Admin', value: 'admin.subscription_modified' },
        { label: 'System Settings Changed', value: 'admin.settings_changed' },
        { label: 'Bulk Operation Performed', value: 'admin.bulk_operation' },
        
        // Notification Actions
        { label: 'Notification Sent', value: 'notification.sent' },
        { label: 'Notification Read', value: 'notification.read' },
        { label: 'Push Notification Sent', value: 'notification.push_sent' },
        
        // Security Actions
        { label: 'Failed Login Attempt', value: 'security.failed_login' },
        { label: 'Account Locked', value: 'security.account_locked' },
        { label: 'Suspicious Activity Detected', value: 'security.suspicious_activity' },
        { label: 'Data Export Requested', value: 'security.data_export' },
        { label: 'Account Deletion Requested', value: 'security.account_deletion_request' },
        
        // System Actions
        { label: 'System Error', value: 'system.error' },
        { label: 'API Rate Limit Exceeded', value: 'system.rate_limit_exceeded' },
        { label: 'Database Backup', value: 'system.backup' },
        { label: 'System Maintenance', value: 'system.maintenance' },
      ],
      required: true,
      admin: {
        description: 'The specific action that was performed',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Authentication', value: 'auth' },
        { label: 'Content', value: 'content' },
        { label: 'Profile', value: 'profile' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Study Plan', value: 'study_plan' },
        { label: 'Referral', value: 'referral' },
        { label: 'Admin', value: 'admin' },
        { label: 'Notification', value: 'notification' },
        { label: 'Security', value: 'security' },
        { label: 'System', value: 'system' },
      ],
      required: true,
      admin: {
        description: 'Category of the action for easier filtering',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who performed the action (null for system actions)',
      },
    },
    {
      name: 'userType',
      type: 'select',
      options: [
        { label: 'Regular User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'System', value: 'system' },
        { label: 'Anonymous', value: 'anonymous' },
      ],
      defaultValue: 'user',
      required: true,
      admin: {
        description: 'Type of user who performed the action',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 1000,
      admin: {
        description: 'Detailed description of what happened',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional structured data related to the action (JSON format)',
      },
    },
    {
      name: 'resourceType',
      type: 'select',
      options: [
        { label: 'User', value: 'users' },
        { label: 'Video', value: 'videos' },
        { label: 'Book', value: 'books' },
        { label: 'Exam Paper', value: 'exam-papers' },
        { label: 'MCQ Question', value: 'mcq' },
        { label: 'Subscription', value: 'subscriptions' },
        { label: 'Transaction', value: 'transactions' },
        { label: 'Study Plan', value: 'study-plans' },
        { label: 'Notification', value: 'notifications' },
        { label: 'Test Result', value: 'test-results' },
        { label: 'User Progress', value: 'user-progress' },
        { label: 'Content Access', value: 'content-access' },
        { label: 'System', value: 'system' },
      ],
      admin: {
        description: 'Type of resource that was affected by the action',
      },
    },
    {
      name: 'resourceId',
      type: 'text',
      admin: {
        description: 'ID of the specific resource that was affected',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'IP address from which the action was performed',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'User agent string of the client',
      },
    },
    {
      name: 'sessionId',
      type: 'text',
      admin: {
        description: 'Session ID for tracking user sessions',
      },
    },
    {
      name: 'success',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the action was successful',
      },
    },
    {
      name: 'errorMessage',
      type: 'text',
      admin: {
        description: 'Error message if the action failed',
        condition: (data) => !data.success,
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Duration of the action in milliseconds (for performance tracking)',
      },
    },
    {
      name: 'timestamp',
      type: 'date',
      defaultValue: () => new Date(),
      required: true,
      admin: {
        description: 'When the action occurred',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Web App', value: 'web' },
        { label: 'Mobile App', value: 'mobile' },
        { label: 'API', value: 'api' },
        { label: 'Admin Panel', value: 'admin' },
        { label: 'System', value: 'system' },
        { label: 'Webhook', value: 'webhook' },
      ],
      defaultValue: 'web',
      admin: {
        description: 'Source platform/interface where the action originated',
      },
    },
    {
      name: 'geolocation',
      type: 'group',
      fields: [
        {
          name: 'country',
          type: 'text',
          admin: {
            description: 'Country where the action was performed',
          },
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City where the action was performed',
          },
        },
        {
          name: 'latitude',
          type: 'number',
          admin: {
            description: 'Latitude coordinate',
          },
        },
        {
          name: 'longitude',
          type: 'number',
          admin: {
            description: 'Longitude coordinate',
          },
        },
      ],
      admin: {
        description: 'Geographic location information (optional)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Ensure timestamp is set
        if (!data.timestamp) {
          data.timestamp = new Date()
        }
        
        // Auto-set category based on action if not provided
        if (data.action && !data.category) {
          const actionPrefix = data.action.split('.')[0]
          data.category = actionPrefix
        }
        
        return data
      },
    ],
  },
}