import { resolveContentAccess, resolveContentMedia } from '@/services/contentAuthorization'
import { describe, expect, it, vi } from 'vitest'

const user = { id: 'user-1', role: 'user' }

const createPayload = ({
  content,
  subscription,
}: {
  content: Record<string, unknown>
  subscription?: Record<string, unknown>
}) => ({
  find: vi.fn().mockResolvedValue({ docs: subscription ? [subscription] : [] }),
  findByID: vi.fn().mockResolvedValue(content),
})

describe('content entitlement authorization', () => {
  it('allows authenticated users to access content that does not require a subscription', async () => {
    const payload = createPayload({
      content: { id: 'video-1', subscriptionRequired: false, video: 'media-1' },
    })

    const result = await resolveContentAccess({
      contentId: 'video-1',
      contentType: 'video',
      payload: payload as never,
      user: user as never,
    })

    expect(result.allowed).toBe(true)
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ overrideAccess: false, user, where: { user: { equals: user.id } } }),
    )
  })

  it('denies premium content without a paid active subscription', async () => {
    const payload = createPayload({
      content: {
        id: 'book-1',
        isActive: true,
        subscriptionRequired: true,
        subscriptionTiers: ['monthly', 'annual'],
      },
    })

    const result = await resolveContentAccess({
      contentId: 'book-1',
      contentType: 'book',
      payload: payload as never,
      user: user as never,
    })

    expect(result.allowed).toBe(false)
  })

  it('allows a higher-tier active plan and rejects inactive content', async () => {
    const payload = createPayload({
      content: {
        id: 'paper-1',
        isActive: true,
        subscriptionRequired: true,
        subscriptionTiers: ['monthly'],
      },
      subscription: {
        endDate: '2099-01-01T00:00:00.000Z',
        paymentStatus: 'paid',
        plan: 'annual',
      },
    })

    const allowed = await resolveContentAccess({
      contentId: 'paper-1',
      contentType: 'exam-paper',
      payload: payload as never,
      user: user as never,
    })
    expect(allowed.allowed).toBe(true)

    payload.findByID.mockResolvedValueOnce({
      id: 'paper-1',
      isActive: false,
      subscriptionRequired: false,
    })
    const inactive = await resolveContentAccess({
      contentId: 'paper-1',
      contentType: 'exam-paper',
      payload: payload as never,
      user: user as never,
    })
    expect(inactive.allowed).toBe(false)
  })

  it('only resolves media fields belonging to the requested content type', async () => {
    const media = { filename: 'paper.pdf', id: 'media-1' }
    const payload = createPayload({ content: media })
    const content = {
      answerKeyPdf: 'media-1',
      hasAnswerKey: true,
      id: 'paper-1',
      pdf: 'media-2',
      subscriptionRequired: false,
    }

    await expect(
      resolveContentMedia({
        content: content as never,
        contentType: 'exam-paper',
        field: 'answerKeyPdf',
        payload: payload as never,
      }),
    ).resolves.toEqual(media)
    await expect(
      resolveContentMedia({
        content: content as never,
        contentType: 'book',
        field: 'answerKeyPdf',
        payload: payload as never,
      }),
    ).resolves.toBeNull()
  })
})
