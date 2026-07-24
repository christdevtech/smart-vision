import type { CollectionConfig, FieldAccess } from 'payload'
import {
  afterChangeUser,
  beforeChangeUser,
  enforceActiveUserBeforeLogin,
  enforcePublicUserDefaults,
  enforceUserAuthOperation,
  recordSuccessfulLogin,
} from './hooks'
import { deleteUser, readUser, updateUser, userCreate } from '@/access/userAccess'

const adminFieldAccess: FieldAccess = ({ req: { user } }) =>
  Boolean(user && ['admin', 'super-admin'].includes(user.role))

const authenticatedFieldAccess: FieldAccess = ({ req: { user } }) => Boolean(user)
const serverOnlyFieldAccess: FieldAccess = () => false
const onboardingCompletionFieldAccess: FieldAccess = ({ req }) =>
  req.context?.allowOnboardingCompletion === true

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'firstName',
    group: 'User Content',
  },
  access: {
    create: userCreate,
    read: readUser,
    update: updateUser,
    delete: deleteUser,
  },
  auth: {
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    forgotPassword: {
      expiration: 60 * 60 * 1000,
    },
    lockTime: 15 * 60 * 1000,
    maxLoginAttempts: 5,
    removeTokenFromResponses: true,
    tokenExpiration: 30 * 24 * 60 * 60,
    useSessions: true,
    verify: {
      generateEmailSubject: () => 'Verify your Smart Vision email',
      generateEmailHTML: ({ token }) => {
        const baseURL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
          /\/$/,
          '',
        )
        const verificationURL = `${baseURL}/auth/verify-email?token=${encodeURIComponent(token)}`

        return `<p>Welcome to Smart Vision.</p><p><a href="${verificationURL}">Verify your email address</a> to activate your account.</p><p>This link is intended only for the account owner.</p>`
      },
    },
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      maxLength: 50,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      maxLength: 50,
    },
    {
      name: 'phoneNumber',
      type: 'text',
      access: {
        create: adminFieldAccess,
        update: authenticatedFieldAccess,
      },
    },
    {
      name: 'dateOfBirth',
      type: 'date',
      access: {
        create: adminFieldAccess,
        update: authenticatedFieldAccess,
      },
    },
    {
      name: 'academicLevel',
      type: 'relationship',
      relationTo: 'academicLevels',
      access: {
        create: adminFieldAccess,
        update: authenticatedFieldAccess,
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      access: {
        create: serverOnlyFieldAccess,
        update: serverOnlyFieldAccess,
      },
    },
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: serverOnlyFieldAccess,
        update: serverOnlyFieldAccess,
      },
    },
    {
      name: 'totalReferrals',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description:
          'Legacy cached count. Authoritative referral totals are derived from referral attributions.',
      },
      access: {
        create: serverOnlyFieldAccess,
        update: serverOnlyFieldAccess,
      },
    },
    {
      name: 'lastActiveAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
      access: {
        create: serverOnlyFieldAccess,
        update: serverOnlyFieldAccess,
      },
    },
    {
      name: 'deletionStatus',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'No deletion request', value: 'none' },
        { label: 'Deletion requested', value: 'requested' },
        { label: 'Anonymized', value: 'anonymized' },
      ],
      admin: {
        description:
          'Account privacy lifecycle state. Administrators may restore a requested account before its scheduled date.',
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: serverOnlyFieldAccess,
        update: serverOnlyFieldAccess,
      },
    },
    {
      name: 'deletionRequestedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: serverOnlyFieldAccess,
        update: serverOnlyFieldAccess,
      },
    },
    {
      name: 'deletionScheduledFor',
      type: 'date',
      admin: {
        description:
          'After this date the scheduled processor removes student activity data and anonymizes the account.',
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: serverOnlyFieldAccess,
        update: serverOnlyFieldAccess,
      },
    },
    {
      name: 'anonymizedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: serverOnlyFieldAccess,
        update: serverOnlyFieldAccess,
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Content Manager', value: 'content-manager' },
        { label: 'Support', value: 'support' },
        { label: 'User', value: 'user' },
      ],
      admin: {
        position: 'sidebar',
      },
      access: {
        create: adminFieldAccess,
        read: () => true,
        update: adminFieldAccess,
      },
      defaultValue: 'user',
      required: true,
    },
    {
      name: 'onboarded',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
      access: {
        create: serverOnlyFieldAccess,
        update: onboardingCompletionFieldAccess,
      },
    },
    {
      name: 'subjects',
      type: 'relationship',
      relationTo: 'subjects',
      hasMany: true,
      access: {
        create: adminFieldAccess,
        update: authenticatedFieldAccess,
      },
    },
    {
      name: 'profilePic',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
      access: {
        create: adminFieldAccess,
        update: authenticatedFieldAccess,
      },
    },
  ],
  hooks: {
    beforeOperation: [enforceUserAuthOperation],
    beforeLogin: [enforceActiveUserBeforeLogin],
    afterLogin: [recordSuccessfulLogin],
    beforeChange: [enforcePublicUserDefaults, beforeChangeUser],
    afterChange: [afterChangeUser],
  },
  timestamps: true,
}
