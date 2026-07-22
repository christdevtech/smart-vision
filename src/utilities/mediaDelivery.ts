import { createHmac, timingSafeEqual } from 'node:crypto'

import type { Media } from '@/payload-types'

export const MEDIA_DELIVERY_TTL_SECONDS = 5 * 60

export type ProtectedContentType = 'book' | 'exam-paper' | 'video'
export type ProtectedMediaField = 'answerKeyPdf' | 'pdf' | 'video'

export type MediaDeliveryClaims = {
  contentId: string
  contentType: ProtectedContentType
  expiresAt: number
  field: ProtectedMediaField
  filename: string
  mediaId: string
  userId: string
  version: 1
}

type CreateMediaDeliveryTokenArgs = Omit<MediaDeliveryClaims, 'expiresAt' | 'version'> & {
  now?: number
}

const getSigningSecret = (): string => {
  const secret = process.env.PAYLOAD_SECRET?.trim()

  if (!secret) {
    throw new Error('PAYLOAD_SECRET is required to sign protected media delivery URLs')
  }

  return secret
}

const sign = (encodedClaims: string): Buffer =>
  createHmac('sha256', getSigningSecret()).update(encodedClaims).digest()

export const createMediaDeliveryToken = ({
  now = Date.now(),
  ...claims
}: CreateMediaDeliveryTokenArgs): string => {
  const encodedClaims = Buffer.from(
    JSON.stringify({
      ...claims,
      expiresAt: Math.floor(now / 1000) + MEDIA_DELIVERY_TTL_SECONDS,
      version: 1,
    } satisfies MediaDeliveryClaims),
  ).toString('base64url')

  return `${encodedClaims}.${sign(encodedClaims).toString('base64url')}`
}

export const verifyMediaDeliveryToken = (
  token: string | null | undefined,
  constraints: Partial<Pick<MediaDeliveryClaims, 'filename' | 'mediaId' | 'userId'>> = {},
  now = Date.now(),
): MediaDeliveryClaims | null => {
  if (!token) return null

  const [encodedClaims, encodedSignature, extra] = token.split('.')
  if (!encodedClaims || !encodedSignature || extra) return null

  let suppliedSignature: Buffer
  let claims: MediaDeliveryClaims

  try {
    suppliedSignature = Buffer.from(encodedSignature, 'base64url')
    claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  const expectedSignature = sign(encodedClaims)
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null
  }

  const nowSeconds = Math.floor(now / 1000)
  if (
    claims.version !== 1 ||
    !Number.isInteger(claims.expiresAt) ||
    claims.expiresAt <= nowSeconds ||
    claims.expiresAt > nowSeconds + MEDIA_DELIVERY_TTL_SECONDS ||
    !claims.userId ||
    !claims.mediaId ||
    !claims.filename ||
    !claims.contentId ||
    !['book', 'exam-paper', 'video'].includes(claims.contentType) ||
    !['answerKeyPdf', 'pdf', 'video'].includes(claims.field)
  ) {
    return null
  }

  if (constraints.userId && claims.userId !== constraints.userId) return null
  if (constraints.mediaId && claims.mediaId !== constraints.mediaId) return null
  if (constraints.filename && claims.filename !== constraints.filename) return null

  return claims
}

export const createMediaFileURL = (
  media: Media,
  claims: Omit<CreateMediaDeliveryTokenArgs, 'filename' | 'mediaId' | 'now'>,
): string => {
  if (!media.filename) {
    throw new Error(`Media ${media.id} does not have a filename`)
  }

  const delivery = createMediaDeliveryToken({
    ...claims,
    filename: media.filename,
    mediaId: media.id,
  })

  return `/api/media/file/${encodeURIComponent(media.filename)}?delivery=${encodeURIComponent(delivery)}`
}

export const createSecurePDFURL = (
  media: Media,
  claims: Omit<CreateMediaDeliveryTokenArgs, 'filename' | 'mediaId' | 'now'>,
): string => {
  if (!media.filename) {
    throw new Error(`Media ${media.id} does not have a filename`)
  }

  const delivery = createMediaDeliveryToken({
    ...claims,
    filename: media.filename,
    mediaId: media.id,
  })

  return `/api/secure-pdf/${encodeURIComponent(media.id)}?delivery=${encodeURIComponent(delivery)}`
}
