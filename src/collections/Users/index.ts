import type { CollectionConfig, FieldAccess } from 'payload'
import { afterChangeUser, beforeChangeUser, enforcePublicUserDefaults } from './hooks'
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
  auth: true,
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
    beforeChange: [enforcePublicUserDefaults, beforeChangeUser],
    afterChange: [afterChangeUser],
  },
  timestamps: true,
}
