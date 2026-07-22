import type { Book, ExamPaper, Media, Subscription, User, Video } from '@/payload-types'
import { isAdminUser } from '@/access/ownerAccess'
import {
  hasTierAccess,
  isSubscriptionActive,
  type SubscriptionPlan,
} from '@/utilities/subscription'
import type { Payload } from 'payload'
import type { ProtectedContentType, ProtectedMediaField } from '@/utilities/mediaDelivery'

export type ProtectedContentDocument = Book | ExamPaper | Video

export type ContentAccessResult = {
  allowed: boolean
  content: ProtectedContentDocument | null
  requiredTiers: SubscriptionPlan[]
  subscription: Subscription | null
  subscriptionActive: boolean
  userPlan: SubscriptionPlan
}

const collectionForContentType = {
  book: 'books',
  'exam-paper': 'exam-papers',
  video: 'videos',
} as const

const getRequiredTiers = (content: ProtectedContentDocument): SubscriptionPlan[] =>
  'subscriptionTiers' in content
    ? ((content.subscriptionTiers as SubscriptionPlan[] | null | undefined) ?? [])
    : []

export const resolveContentAccess = async ({
  contentId,
  contentType,
  payload,
  user,
}: {
  contentId: string
  contentType: ProtectedContentType
  payload: Payload
  user: User
}): Promise<ContentAccessResult> => {
  let content: ProtectedContentDocument | null = null

  try {
    content = (await payload.findByID({
      collection: collectionForContentType[contentType],
      depth: 1,
      id: contentId,
      overrideAccess: true,
    })) as ProtectedContentDocument
  } catch {
    return {
      allowed: false,
      content: null,
      requiredTiers: [],
      subscription: null,
      subscriptionActive: false,
      userPlan: 'free',
    }
  }

  if (!content || ('isActive' in content && content.isActive === false)) {
    return {
      allowed: false,
      content,
      requiredTiers: [],
      subscription: null,
      subscriptionActive: false,
      userPlan: 'free',
    }
  }

  const requiredTiers = getRequiredTiers(content)

  if (isAdminUser(user)) {
    return {
      allowed: true,
      content,
      requiredTiers,
      subscription: null,
      subscriptionActive: true,
      userPlan: 'annual',
    }
  }

  const subscriptions = await payload.find({
    collection: 'subscriptions',
    limit: 1,
    overrideAccess: false,
    sort: '-createdAt',
    user,
    where: { user: { equals: user.id } },
  })
  const subscription = (subscriptions.docs[0] as Subscription | undefined) ?? null
  const subscriptionActive = isSubscriptionActive(subscription)
  const userPlan: SubscriptionPlan = subscription?.plan ?? 'free'

  return {
    allowed: hasTierAccess(
      userPlan,
      requiredTiers,
      content.subscriptionRequired,
      subscriptionActive,
    ),
    content,
    requiredTiers,
    subscription,
    subscriptionActive,
    userPlan,
  }
}
const allowedFields: Record<ProtectedContentType, ProtectedMediaField[]> = {
  book: ['pdf'],
  'exam-paper': ['pdf', 'answerKeyPdf'],
  video: ['video'],
}

export const resolveContentMedia = async ({
  content,
  contentType,
  field,
  payload,
}: {
  content: ProtectedContentDocument
  contentType: ProtectedContentType
  field: ProtectedMediaField
  payload: Payload
}): Promise<Media | null> => {
  if (!allowedFields[contentType].includes(field)) return null
  if (field === 'answerKeyPdf' && (!('hasAnswerKey' in content) || !content.hasAnswerKey)) {
    return null
  }

  const value = content[field as keyof ProtectedContentDocument] as Media | string | null | undefined
  if (!value) return null
  if (typeof value === 'object') return value

  try {
    return (await payload.findByID({
      collection: 'media',
      id: value,
      overrideAccess: true,
    })) as Media
  } catch {
    return null
  }
}
