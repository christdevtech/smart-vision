import type { CollectionConfig } from 'payload'
import { beforeChangeUser } from './hooks'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
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
    },
    {
      name: 'dateOfBirth',
      type: 'date',
    },
    {
      name: 'educationLevel',
      type: 'select',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'High School', value: 'highschool' },
        { label: 'University', value: 'university' },
      ],
    },
    // {
    //   name: 'preferredSubjects',
    //   type: 'relationship',
    //   relationTo: 'subjects',
    //   hasMany: true,
    // },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'totalReferrals',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastActiveAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Super Admin', value: 'superadmin' },
        { label: 'Content Manager', value: 'contentmanager' },
        { label: 'Support', value: 'support' },
        { label: 'User', value: 'user' },
      ],
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'user',
    },
  ],
  hooks: {
    beforeChange: [beforeChangeUser],
  },
  timestamps: true,
}
