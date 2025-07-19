import type { PayloadRequest } from 'payload'

type RevalidateArgs = {
  collection: string
  doc: any
  req: PayloadRequest
}

export const revalidate = async ({ collection, doc, req }: RevalidateArgs): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    try {
      const revalidateURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/revalidate`
      
      const revalidateResponse = await fetch(revalidateURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PAYLOAD_SECRET}`,
        },
        body: JSON.stringify({
          collection,
          slug: doc.slug,
        }),
      })

      if (revalidateResponse.ok) {
        req.payload.logger.info(`Revalidated: ${collection}/${doc.slug}`)
      } else {
        req.payload.logger.error(`Failed to revalidate: ${collection}/${doc.slug}`)
      }
    } catch (error) {
      req.payload.logger.error(`Error revalidating ${collection}/${doc.slug}: ${error}`)
    }
  }
}