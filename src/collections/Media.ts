import type { CollectionConfig, FieldAccess } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { authenticated } from '../access/authenticated'
import { adminFieldAccess, isAdminUser, ownerOrAdmin } from '@/access/ownerAccess'
import { bindAuthenticatedOwner } from '@/hooks/bindAuthenticatedOwner'
import { readMedia } from '@/access/mediaAccess'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const authenticatedFieldAccess: FieldAccess = ({ req }) => Boolean(req.user)

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Platform Content',
  },
  access: {
    create: authenticated,
    delete: ownerOrAdmin('owner'),
    read: readMedia,
    update: ownerOrAdmin('owner'),
  },
  fields: [
    {
      name: 'accessScope',
      type: 'select',
      defaultValue: 'protected',
      options: [
        { label: 'Protected course content', value: 'protected' },
        { label: 'Public asset', value: 'public' },
        { label: 'Owner only', value: 'owner' },
      ],
      required: true,
      admin: {
        description:
          'Protected files require a lesson entitlement. Use Public only for covers, branding, and other intentionally public assets.',
        position: 'sidebar',
      },
      access: {
        create: authenticatedFieldAccess,
        update: adminFieldAccess,
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: authenticatedFieldAccess,
        update: adminFieldAccess,
      },
    },
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  hooks: {
    beforeValidate: [
      bindAuthenticatedOwner('owner'),
      ({ data, operation, req }) => {
        if (operation === 'create' && data && req.user && !isAdminUser(req.user)) {
          return { ...data, accessScope: 'owner' }
        }

        return data
      },
    ],
  },
  upload: {
    // Used only for local development. The R2 adapter disables local storage when configured.
    staticDir: path.resolve(dirname, '../../public/media'),
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
