import { isAdminUser } from '@/access/ownerAccess'
import { verifyMediaDeliveryToken } from '@/utilities/mediaDelivery'
import type { Access, Where } from 'payload'

const publicMediaQuery: Where = {
  or: [
    { accessScope: { equals: 'public' } },
    {
      and: [
        { accessScope: { exists: false } },
        { mimeType: { contains: 'image/' } },
      ],
    },
  ],
}

const readQueryValue = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

const filenameFromRequest = (pathname: string | undefined): string | null => {
  if (!pathname) return null
  const marker = '/file/'
  const markerIndex = pathname.lastIndexOf(marker)
  if (markerIndex === -1) return null

  try {
    return decodeURIComponent(pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

export const readMedia: Access = ({ id, req }) => {
  if (isAdminUser(req.user)) return true

  if (req.user) {
    const delivery = readQueryValue(req.query.delivery)
    const filename = filenameFromRequest(req.pathname)
    const claims = verifyMediaDeliveryToken(delivery, {
      ...(filename ? { filename } : {}),
      ...(id ? { mediaId: String(id) } : {}),
      userId: req.user.id,
    })

    if (claims && filename) return true

    return {
      or: [
        ...(publicMediaQuery.or ?? []),
        {
          and: [
            { accessScope: { equals: 'owner' } },
            { owner: { equals: req.user.id } },
          ],
        },
      ],
    }
  }

  return publicMediaQuery
}
