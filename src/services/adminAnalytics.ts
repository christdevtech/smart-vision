import type {
  ActivityLog,
  AcademicLevel,
  Subject,
  TestResult,
  Transaction,
  User,
} from '@/payload-types'
import type { Payload } from 'payload'

export const DEFAULT_ADMIN_ANALYTICS_DAYS = 30

export type AdminAnalyticsTrendPoint = {
  assessments: number
  averageScore: number | null
  date: string
  label: string
  newStudents: number
}

export type AdminAnalyticsSnapshot = {
  attention: {
    expiringSubscriptions: number
    failedPayments: number
    incompleteOnboarding: number
    pendingPayments: number
  }
  generatedAt: string
  inventory: {
    books: number
    examPapers: number
    questions: number
    total: number
    videos: number
  }
  metrics: {
    activeSubscriptions: number
    assessmentAttempts: number
    assessmentSampleSize: number
    averageAssessmentScore: number | null
    newStudents: number
    onboardedStudents: number
    onboardingRate: number
    revenue: number
    revenueSampleSize: number
    students: number
  }
  periodDays: number
  recentActivity: Array<{
    action: string
    description: string
    id: string
    success: boolean
    timestamp: string
    userLabel: string
  }>
  recentStudents: Array<{
    academicLevel: string
    createdAt: string
    email: string
    id: string
    isActive: boolean
    name: string
    onboarded: boolean
  }>
  recentTransactions: Array<{
    amount: number
    date: string
    id: string
    plan: string
    status: string
    transactionId: string
    userLabel: string
  }>
  trend: AdminAnalyticsTrendPoint[]
}

const beginningOfUTCDay = (value: Date) => {
  const result = new Date(value)
  result.setUTCHours(0, 0, 0, 0)
  return result
}

const addUTCDays = (value: Date, days: number) => {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

const dateKey = (value: string | Date) => new Date(value).toISOString().slice(0, 10)

const relationName = (
  value: string | AcademicLevel | Subject | User | null | undefined,
): string => {
  if (!value) return 'Not set'
  if (typeof value === 'string') return value
  if ('firstName' in value) return `${value.firstName} ${value.lastName}`.trim()
  return value.name
}

export function buildAdminAnalyticsTrend({
  assessmentResults,
  now,
  students,
}: {
  assessmentResults: Pick<TestResult, 'completedAt' | 'scorePercentage'>[]
  now: Date
  students: Pick<User, 'createdAt'>[]
}): AdminAnalyticsTrendPoint[] {
  const today = beginningOfUTCDay(now)
  const firstDay = addUTCDays(today, -13)
  const buckets = new Map<
    string,
    { assessments: number; newStudents: number; scoreTotal: number }
  >()

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const day = addUTCDays(firstDay, dayOffset)
    buckets.set(dateKey(day), { assessments: 0, newStudents: 0, scoreTotal: 0 })
  }

  for (const student of students) {
    const bucket = buckets.get(dateKey(student.createdAt))
    if (bucket) bucket.newStudents += 1
  }

  for (const result of assessmentResults) {
    const bucket = buckets.get(dateKey(result.completedAt))
    if (!bucket) continue
    bucket.assessments += 1
    bucket.scoreTotal += result.scorePercentage
  }

  return [...buckets.entries()].map(([date, bucket]) => ({
    assessments: bucket.assessments,
    averageScore:
      bucket.assessments > 0 ? Math.round((bucket.scoreTotal / bucket.assessments) * 10) / 10 : null,
    date,
    label: new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00.000Z`)),
    newStudents: bucket.newStudents,
  }))
}

export async function getAdminAnalytics(
  payload: Payload,
  user: User,
  { days = DEFAULT_ADMIN_ANALYTICS_DAYS, now = new Date() } = {},
): Promise<AdminAnalyticsSnapshot> {
  const nowISO = now.toISOString()
  const periodStart = addUTCDays(now, -days).toISOString()
  const trendStart = addUTCDays(beginningOfUTCDay(now), -13).toISOString()
  const sevenDaysAgo = addUTCDays(now, -7).toISOString()
  const sevenDaysFromNow = addUTCDays(now, 7).toISOString()
  const access = { overrideAccess: false as const, user }

  const [
    students,
    onboardedStudents,
    newStudents,
    activeSubscriptions,
    expiringSubscriptions,
    pendingPayments,
    failedPayments,
    videos,
    books,
    examPapers,
    questions,
    studentTrendResult,
    assessmentResult,
    revenueResult,
    recentStudentResult,
    recentTransactionResult,
    recentActivityResult,
  ] = await Promise.all([
    payload.count({
      ...access,
      collection: 'users',
      where: { role: { equals: 'user' } },
    }),
    payload.count({
      ...access,
      collection: 'users',
      where: { and: [{ role: { equals: 'user' } }, { onboarded: { equals: true } }] },
    }),
    payload.count({
      ...access,
      collection: 'users',
      where: {
        and: [{ role: { equals: 'user' } }, { createdAt: { greater_than_equal: periodStart } }],
      },
    }),
    payload.count({
      ...access,
      collection: 'subscriptions',
      where: {
        and: [
          { paymentStatus: { equals: 'paid' } },
          { endDate: { greater_than: nowISO } },
        ],
      },
    }),
    payload.count({
      ...access,
      collection: 'subscriptions',
      where: {
        and: [
          { paymentStatus: { equals: 'paid' } },
          { endDate: { greater_than: nowISO } },
          { endDate: { less_than_equal: sevenDaysFromNow } },
        ],
      },
    }),
    payload.count({
      ...access,
      collection: 'transactions',
      where: { status: { in: ['created', 'pending'] } },
    }),
    payload.count({
      ...access,
      collection: 'transactions',
      where: {
        and: [
          { status: { equals: 'failed' } },
          { dateInitiated: { greater_than_equal: sevenDaysAgo } },
        ],
      },
    }),
    payload.count({ ...access, collection: 'videos' }),
    payload.count({ ...access, collection: 'books' }),
    payload.count({ ...access, collection: 'exam-papers' }),
    payload.count({ ...access, collection: 'mcq' }),
    payload.find({
      ...access,
      collection: 'users',
      depth: 0,
      limit: 5000,
      pagination: false,
      select: { createdAt: true },
      where: {
        and: [{ role: { equals: 'user' } }, { createdAt: { greater_than_equal: trendStart } }],
      },
    }),
    payload.find({
      ...access,
      collection: 'test-results',
      depth: 1,
      limit: 5000,
      sort: '-completedAt',
      select: {
        academicLevel: true,
        completedAt: true,
        correctAnswers: true,
        grade: true,
        scorePercentage: true,
        subject: true,
        testType: true,
        timeUsed: true,
        totalQuestions: true,
        user: true,
      },
      where: { completedAt: { greater_than_equal: periodStart } },
    }),
    payload.find({
      ...access,
      collection: 'transactions',
      depth: 1,
      limit: 5000,
      sort: '-dateConfirmed',
      select: {
        amount: true,
        dateConfirmed: true,
        dateInitiated: true,
        paymentMedium: true,
        plan: true,
        revenue: true,
        status: true,
        transactionId: true,
        user: true,
      },
      where: {
        and: [
          { status: { equals: 'successful' } },
          { dateConfirmed: { greater_than_equal: periodStart } },
        ],
      },
    }),
    payload.find({
      ...access,
      collection: 'users',
      depth: 1,
      limit: 6,
      sort: '-createdAt',
      select: {
        academicLevel: true,
        createdAt: true,
        email: true,
        firstName: true,
        isActive: true,
        lastName: true,
        onboarded: true,
      },
      where: { role: { equals: 'user' } },
    }),
    payload.find({
      ...access,
      collection: 'transactions',
      depth: 1,
      limit: 6,
      sort: '-dateInitiated',
      select: {
        amount: true,
        dateConfirmed: true,
        dateInitiated: true,
        plan: true,
        status: true,
        transactionId: true,
        user: true,
      },
    }),
    payload.find({
      ...access,
      collection: 'activity-logs',
      depth: 1,
      limit: 8,
      sort: '-timestamp',
      select: {
        action: true,
        description: true,
        success: true,
        timestamp: true,
        user: true,
      },
    }),
  ])

  const assessmentDocs = assessmentResult.docs as TestResult[]
  const transactionDocs = revenueResult.docs as Transaction[]
  const scoreTotal = assessmentDocs.reduce((total, result) => total + result.scorePercentage, 0)
  const revenue = transactionDocs.reduce(
    (total, transaction) => total + (transaction.revenue ?? transaction.amount),
    0,
  )
  const incompleteOnboarding = Math.max(students.totalDocs - onboardedStudents.totalDocs, 0)

  return {
    attention: {
      expiringSubscriptions: expiringSubscriptions.totalDocs,
      failedPayments: failedPayments.totalDocs,
      incompleteOnboarding,
      pendingPayments: pendingPayments.totalDocs,
    },
    generatedAt: nowISO,
    inventory: {
      books: books.totalDocs,
      examPapers: examPapers.totalDocs,
      questions: questions.totalDocs,
      total: videos.totalDocs + books.totalDocs + examPapers.totalDocs + questions.totalDocs,
      videos: videos.totalDocs,
    },
    metrics: {
      activeSubscriptions: activeSubscriptions.totalDocs,
      assessmentAttempts: assessmentResult.totalDocs,
      assessmentSampleSize: assessmentDocs.length,
      averageAssessmentScore:
        assessmentDocs.length > 0
          ? Math.round((scoreTotal / assessmentDocs.length) * 10) / 10
          : null,
      newStudents: newStudents.totalDocs,
      onboardedStudents: onboardedStudents.totalDocs,
      onboardingRate:
        students.totalDocs > 0
          ? Math.round((onboardedStudents.totalDocs / students.totalDocs) * 1000) / 10
          : 0,
      revenue,
      revenueSampleSize: transactionDocs.length,
      students: students.totalDocs,
    },
    periodDays: days,
    recentActivity: (recentActivityResult.docs as ActivityLog[]).map((activity) => ({
      action: activity.action,
      description: activity.description || activity.action.replaceAll('.', ' '),
      id: activity.id,
      success: activity.success !== false,
      timestamp: activity.timestamp,
      userLabel: relationName(activity.user),
    })),
    recentStudents: (recentStudentResult.docs as User[]).map((student) => ({
      academicLevel: relationName(student.academicLevel),
      createdAt: student.createdAt,
      email: student.email,
      id: student.id,
      isActive: student.isActive !== false,
      name: `${student.firstName} ${student.lastName}`.trim(),
      onboarded: student.onboarded === true,
    })),
    recentTransactions: (recentTransactionResult.docs as Transaction[]).map((transaction) => ({
      amount: transaction.amount,
      date: transaction.dateConfirmed || transaction.dateInitiated,
      id: transaction.id,
      plan: transaction.plan || 'Not set',
      status: transaction.status || 'created',
      transactionId: transaction.transactionId,
      userLabel: relationName(transaction.user),
    })),
    trend: buildAdminAnalyticsTrend({
      assessmentResults: assessmentDocs,
      now,
      students: studentTrendResult.docs as User[],
    }),
  }
}
