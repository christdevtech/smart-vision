import { createR2StorageOptions, getR2StorageSettings } from '@/plugins/r2Storage'
import { describe, expect, it } from 'vitest'

const completeEnvironment = {
  NODE_ENV: 'production',
  R2_ACCESS_KEY_ID: 'access-key',
  R2_BUCKET: 'lesson-media',
  R2_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
  R2_REGION: 'auto',
  R2_SECRET_ACCESS_KEY: 'secret-key',
}

describe('Cloudflare R2 storage configuration', () => {
  it('uses local storage when R2 is intentionally absent outside production', () => {
    expect(getR2StorageSettings({ NODE_ENV: 'development' })).toEqual({
      accessKeyId: '',
      bucket: '',
      configured: false,
      enabled: false,
      endpoint: '',
      region: 'auto',
      secretAccessKey: '',
    })
  })

  it('fails when an R2 configuration is only partially supplied', () => {
    expect(() =>
      getR2StorageSettings({
        NODE_ENV: 'development',
        R2_BUCKET: 'lesson-media',
      }),
    ).toThrow(
      'Cloudflare R2 storage is not fully configured. Missing: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT',
    )
  })

  it('fails instead of using ephemeral storage in the Cloud Run runtime', () => {
    expect(() =>
      getR2StorageSettings({ NODE_ENV: 'production', K_SERVICE: 'smart-vision' }),
    ).toThrow('Cloudflare R2 storage is not fully configured')
  })

  it('keeps the client adapter in production builds where runtime secrets are unavailable', () => {
    expect(getR2StorageSettings({ NODE_ENV: 'production' })).toMatchObject({
      configured: false,
      enabled: true,
    })
  })

  it('requires HTTPS for the production R2 endpoint', () => {
    expect(() =>
      getR2StorageSettings({
        ...completeEnvironment,
        R2_ENDPOINT: 'http://account-id.r2.cloudflarestorage.com',
      }),
    ).toThrow('R2_ENDPOINT must use HTTPS in production')
  })

  it('enables direct client uploads with R2-compatible path-style addressing', () => {
    const options = createR2StorageOptions(completeEnvironment)

    expect(options).toMatchObject({
      alwaysInsertFields: true,
      bucket: 'lesson-media',
      clientUploads: {
        access: expect.any(Function),
      },
      collections: {
        media: {
          prefix: 'smart-vision-media',
          signedDownloads: { expiresIn: 300 },
        },
      },
      config: {
        endpoint: 'https://account-id.r2.cloudflarestorage.com',
        forcePathStyle: true,
        region: 'auto',
      },
      enabled: true,
    })

    const access = (options.clientUploads as { access: (args: unknown) => boolean }).access
    expect(access({ req: { user: { id: 'admin-1', role: 'admin' } } })).toBe(true)
    expect(access({ req: { user: { id: 'user-1', role: 'user' } } })).toBe(false)
  })
})
