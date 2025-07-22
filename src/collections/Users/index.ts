import type { CollectionConfig } from 'payload'
import { beforeChangeUser } from './hooks'
import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { selfOrAdmin } from '@/access/selfOrAdmin'
import { admin } from '@/access/admin'
import { deleteUser, readUser, updateUser, userCreate } from '@/access/userAccess'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'firstName',
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
    },
    {
      name: 'dateOfBirth',
      type: 'date',
    },
    {
      name: 'academicLevel',
      type: 'relationship',
      relationTo: 'academicLevels',
    },
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
        { label: 'Admin', value: 'admin' },
        { label: 'Content Manager', value: 'contentmanager' },
        { label: 'Support', value: 'support' },
        { label: 'User', value: 'user' },
      ],
      admin: {
        position: 'sidebar',
      },
      access: {
        create: () => true,
        read: () => true,
        update: ({ req: { user } }) => {
          if (user) {
            return Boolean(['admin', 'superadmin'].includes(user?.role))
          } else return false
        },
      },
      defaultValue: 'user',
      required: true,
    },
    {
      name: 'profilePic',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [beforeChangeUser],
  },
  timestamps: true,
}
