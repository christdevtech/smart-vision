import type { S3StorageOptions } from '@payloadcms/storage-s3'

type Environment = Readonly<Record<string, string | undefined>>

const requiredR2EnvironmentVariables = [
  'R2_BUCKET',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
] as const

export type R2StorageSettings = {
  accessKeyId: string
  bucket: string
  configured: boolean
  enabled: boolean
  endpoint: string
  region: string
  secretAccessKey: string
}

const readEnvironmentValue = (environment: Environment, key: string): string =>
  environment[key]?.trim() ?? ''

export const getR2StorageSettings = (environment: Environment = process.env): R2StorageSettings => {
  const values = Object.fromEntries(
    requiredR2EnvironmentVariables.map((key) => [key, readEnvironmentValue(environment, key)]),
  ) as Record<(typeof requiredR2EnvironmentVariables)[number], string>

  const missingVariables = requiredR2EnvironmentVariables.filter((key) => !values[key])
  const hasAnyR2Configuration = requiredR2EnvironmentVariables.some((key) => Boolean(values[key]))
  const isProductionBuildOrRuntime = environment.NODE_ENV === 'production'
  const requiresR2AtRuntime = isProductionBuildOrRuntime && Boolean(environment.K_SERVICE)

  if (missingVariables.length > 0 && (hasAnyR2Configuration || requiresR2AtRuntime)) {
    throw new Error(
      `Cloudflare R2 storage is not fully configured. Missing: ${missingVariables.join(', ')}`,
    )
  }

  const configured = missingVariables.length === 0
  // Keep the adapter and its admin client handler in production bundles. Cloud Build does not
  // receive runtime secrets, while Cloud Run re-evaluates this config with its R2 environment.
  const enabled = configured || isProductionBuildOrRuntime
  const endpoint = values.R2_ENDPOINT

  if (configured) {
    let endpointURL: URL

    try {
      endpointURL = new URL(endpoint)
    } catch {
      throw new Error('R2_ENDPOINT must be a valid URL')
    }

    if (!['http:', 'https:'].includes(endpointURL.protocol)) {
      throw new Error('R2_ENDPOINT must use HTTP or HTTPS')
    }

    if (isProductionBuildOrRuntime && endpointURL.protocol !== 'https:') {
      throw new Error('R2_ENDPOINT must use HTTPS in production')
    }
  }

  return {
    accessKeyId: values.R2_ACCESS_KEY_ID,
    bucket: values.R2_BUCKET,
    configured,
    enabled,
    endpoint,
    region: readEnvironmentValue(environment, 'R2_REGION') || 'auto',
    secretAccessKey: values.R2_SECRET_ACCESS_KEY,
  }
}

export const createR2StorageOptions = (
  environment: Environment = process.env,
): S3StorageOptions => {
  const settings = getR2StorageSettings(environment)

  return {
    alwaysInsertFields: true,
    bucket: settings.bucket || 'r2-build-placeholder',
    clientUploads: settings.enabled
      ? {
          access: ({ req }) =>
            Boolean(req.user && ['admin', 'super-admin'].includes(req.user.role ?? '')),
        }
      : false,
    collections: {
      media: {
        prefix: 'smart-vision-media',
        signedDownloads: { expiresIn: 5 * 60 },
      },
    },
    config: {
      credentials: settings.configured
        ? {
            accessKeyId: settings.accessKeyId,
            secretAccessKey: settings.secretAccessKey,
          }
        : undefined,
      endpoint: settings.endpoint || undefined,
      forcePathStyle: true,
      region: settings.region,
    },
    enabled: settings.enabled,
  }
}
