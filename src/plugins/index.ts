import { Plugin } from 'payload'
import { s3Storage } from '@payloadcms/storage-s3'

export const plugins: Plugin[] = [
  s3Storage({
    collections: {
      media: { prefix: 'smart-vision-media' },
    },
    bucket: process.env.R2_BUCKET || '',
    config: {
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
      region: process.env.R2_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT || '',
    },
  }),
]
