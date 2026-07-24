import ExcelJS from 'exceljs'
import { describe, expect, it, vi } from 'vitest'

import {
  buildAdminAnalyticsTrend,
  getAdminAnalytics,
  type AdminAnalyticsSnapshot,
} from '@/services/adminAnalytics'
import { createAdminAnalyticsWorkbook } from '@/services/adminAnalyticsWorkbook'

const adminUser = {
  id: 'admin-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as any

const emptyPage = {
  docs: [],
  hasNextPage: false,
  hasPrevPage: false,
  limit: 10,
  nextPage: null,
  page: 1,
  pagingCounter: 1,
  prevPage: null,
  totalDocs: 0,
  totalPages: 1,
}

describe('admin analytics', () => {
  it('builds a stable fourteen-day activity trend', () => {
    const trend = buildAdminAnalyticsTrend({
      assessmentResults: [
        { completedAt: '2026-07-23T09:00:00.000Z', scorePercentage: 80 },
        { completedAt: '2026-07-23T14:00:00.000Z', scorePercentage: 90 },
      ],
      now: new Date('2026-07-24T12:00:00.000Z'),
      students: [{ createdAt: '2026-07-23T08:00:00.000Z' }],
    })

    expect(trend).toHaveLength(14)
    expect(trend.at(-2)).toMatchObject({
      assessments: 2,
      averageScore: 85,
      date: '2026-07-23',
      newStudents: 1,
    })
    expect(trend.at(-1)).toMatchObject({
      assessments: 0,
      averageScore: null,
      date: '2026-07-24',
      newStudents: 0,
    })
  })

  it('enforces the authenticated admin access context on every Payload query', async () => {
    const payload = {
      count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
      find: vi.fn().mockResolvedValue(emptyPage),
    }

    await getAdminAnalytics(payload as any, adminUser, {
      now: new Date('2026-07-24T12:00:00.000Z'),
    })

    for (const [query] of [...payload.count.mock.calls, ...payload.find.mock.calls]) {
      expect(query).toMatchObject({
        overrideAccess: false,
        user: adminUser,
      })
    }
  })

  it('creates a genuine multi-sheet workbook without sensitive fields', async () => {
    const analytics: AdminAnalyticsSnapshot = {
      attention: {
        expiringSubscriptions: 1,
        failedPayments: 2,
        incompleteOnboarding: 3,
        pendingPayments: 4,
      },
      generatedAt: '2026-07-24T12:00:00.000Z',
      inventory: { books: 2, examPapers: 3, questions: 40, total: 50, videos: 5 },
      metrics: {
        activeSubscriptions: 8,
        assessmentAttempts: 1,
        assessmentSampleSize: 1,
        averageAssessmentScore: 80,
        grossPayments: 3000,
        newStudents: 1,
        onboardedStudents: 7,
        onboardingRate: 70,
        platformRevenueAfterReferralRewards: 2000,
        providerFees: 100,
        referralRewardExpense: 900,
        revenue: 2900,
        revenueSampleSize: 1,
        students: 10,
      },
      periodDays: 30,
      recentActivity: [],
      recentStudents: [],
      recentTransactions: [],
      trend: [],
    }
    const student = {
      id: 'student-1',
      academicLevel: {
        id: 'level-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        name: 'Form 5',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      createdAt: '2026-07-20T10:00:00.000Z',
      dateOfBirth: '2009-01-01T00:00:00.000Z',
      email: 'student@example.com',
      firstName: 'Student',
      isActive: true,
      lastName: 'One',
      onboarded: true,
      role: 'user',
      updatedAt: '2026-07-20T10:00:00.000Z',
    } as any
    const buffer = await createAdminAnalyticsWorkbook(analytics, {
      assessments: [
        {
          id: 'result-1',
          academicLevel: student.academicLevel,
          completedAt: '2026-07-23T10:00:00.000Z',
          correctAnswers: 8,
          createdAt: '2026-07-23T10:00:00.000Z',
          incorrectAnswers: 2,
          isCompleted: true,
          questions: [],
          scorePercentage: 80,
          startedAt: '2026-07-23T09:50:00.000Z',
          subject: {
            id: 'subject-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            name: 'Mathematics',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          testType: 'practice',
          timeUsed: 10,
          totalQuestions: 10,
          updatedAt: '2026-07-23T10:00:00.000Z',
          user: student,
        } as any,
      ],
      assessmentsTruncated: false,
      referralRewards: [
        {
          id: 'reward-1',
          grossPaymentAmount: 3000,
          ineligibilityReason: null,
          plan: 'monthly',
          platformRevenueAfterReward: 2000,
          providerFeeAmount: 100,
          referredUser: student,
          referrer: student,
          revenue: 2900,
          rewardAmount: 900,
          rewardRateBasisPoints: 3000,
          settledAt: '2026-07-23T10:00:00.000Z',
          status: 'available',
        } as any,
      ],
      referralRewardsTruncated: false,
      students: [student],
      studentsTruncated: false,
      transactions: [
        {
          id: 'transaction-1',
          amount: 3000,
          createdAt: '2026-07-23T10:00:00.000Z',
          dateInitiated: '2026-07-23T10:00:00.000Z',
          phone: '670000000',
          providerFeeAmount: 100,
          revenue: 2900,
          status: 'successful',
          transactionId: 'sv-1',
          updatedAt: '2026-07-23T10:00:00.000Z',
          user: student,
        } as any,
      ],
      transactionsTruncated: false,
    })

    expect(buffer.subarray(0, 2).toString()).toBe('PK')

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Summary',
      'Students',
      'Assessment Results',
      'Transactions',
      'Referral Rewards',
    ])

    const workbookText = workbook.worksheets
      .flatMap((sheet) =>
        sheet
          .getSheetValues()
          .flatMap((row) => (Array.isArray(row) ? row : []))
          .map(String),
      )
      .join(' ')

    expect(workbookText).not.toContain('dateOfBirth')
    expect(workbookText).not.toContain('2009-01-01')
    expect(workbookText).not.toContain('670000000')
    expect(workbook.getWorksheet('Assessment Results')?.getCell('G2').value).toBe(0.8)
  })
})
