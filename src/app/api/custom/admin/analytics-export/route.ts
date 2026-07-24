import config from '@payload-config'
import { getPayload } from 'payload'

import type { TestResult, Transaction, User } from '@/payload-types'
import { getAdminAnalytics } from '@/services/adminAnalytics'
import { createAdminAnalyticsWorkbook } from '@/services/adminAnalyticsWorkbook'
import {
  ADMINISTRATIVE_ROLES,
  authorizeAdministrativeRequest,
} from '@/utilities/requestAuthorization'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const EXPORT_ROW_LIMIT = 10_000
const ALLOWED_PERIODS = new Set([30, 90, 365])

const addDays = (value: Date, days: number) => {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const authorization = await authorizeAdministrativeRequest(payload, request.headers, {
    allowedRoles: ADMINISTRATIVE_ROLES,
  })

  if (!authorization || authorization.kind !== 'user') {
    return Response.json({ error: 'Administrator access required' }, { status: 403 })
  }

  const url = new URL(request.url)
  const requestedDays = Number(url.searchParams.get('days') || 30)
  const days = ALLOWED_PERIODS.has(requestedDays) ? requestedDays : 30
  const now = new Date()
  const periodStart = addDays(now, -days).toISOString()
  const access = {
    overrideAccess: false as const,
    user: authorization.user,
  }

  try {
    const [analytics, studentResult, assessmentResult, transactionResult] = await Promise.all([
      getAdminAnalytics(payload, authorization.user, { days, now }),
      payload.find({
        ...access,
        collection: 'users',
        depth: 1,
        limit: EXPORT_ROW_LIMIT,
        sort: '-createdAt',
        select: {
          academicLevel: true,
          createdAt: true,
          email: true,
          firstName: true,
          isActive: true,
          lastActiveAt: true,
          lastName: true,
          onboarded: true,
        },
        where: {
          and: [
            { role: { equals: 'user' } },
            { createdAt: { greater_than_equal: periodStart } },
          ],
        },
      }),
      payload.find({
        ...access,
        collection: 'test-results',
        depth: 1,
        limit: EXPORT_ROW_LIMIT,
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
        limit: EXPORT_ROW_LIMIT,
        sort: '-dateInitiated',
        select: {
          amount: true,
          dateConfirmed: true,
          dateInitiated: true,
          paymentMedium: true,
          plan: true,
          reconciled: true,
          revenue: true,
          status: true,
          transactionId: true,
          user: true,
        },
        where: { dateInitiated: { greater_than_equal: periodStart } },
      }),
    ])

    const workbook = await createAdminAnalyticsWorkbook(analytics, {
      assessments: assessmentResult.docs as TestResult[],
      assessmentsTruncated: assessmentResult.hasNextPage,
      students: studentResult.docs as User[],
      studentsTruncated: studentResult.hasNextPage,
      transactions: transactionResult.docs as Transaction[],
      transactionsTruncated: transactionResult.hasNextPage,
    })

    try {
      await payload.create({
        ...access,
        collection: 'activity-logs',
        data: {
          action: 'security.data_export',
          category: 'security',
          description: `Exported the ${days}-day administration analytics workbook`,
          resourceType: 'system',
          source: 'admin',
          success: true,
          timestamp: now.toISOString(),
          user: authorization.user.id,
          userType: 'admin',
        },
      })
    } catch (error) {
      payload.logger.warn({
        err: error instanceof Error ? error : new Error(String(error)),
        msg: 'Analytics export succeeded but its audit event could not be recorded',
      })
    }

    const reportDate = now.toISOString().slice(0, 10)
    return new Response(workbook, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': `attachment; filename="smartvision-admin-report-${days}d-${reportDate}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'X-Content-Type-Options': 'nosniff',
      },
      status: 200,
    })
  } catch (error) {
    payload.logger.error({
      err: error instanceof Error ? error : new Error(String(error)),
      msg: 'Unable to create admin analytics export',
    })
    return Response.json({ error: 'Unable to generate analytics export' }, { status: 500 })
  }
}
