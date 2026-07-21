import { Plugin } from 'payload'
import { s3Storage } from '@payloadcms/storage-s3'

import { createR2StorageOptions } from './r2Storage'

export const plugins: Plugin[] = [s3Storage(createR2StorageOptions())]
