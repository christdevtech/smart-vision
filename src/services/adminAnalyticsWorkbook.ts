import ExcelJS, { type Column, type Row, type Worksheet } from 'exceljs'

import type {
  AcademicLevel,
  ReferralReward,
  Subject,
  TestResult,
  Transaction,
  User,
} from '@/payload-types'
import type { AdminAnalyticsSnapshot } from '@/services/adminAnalytics'

export type AdminAnalyticsExportData = {
  assessments: TestResult[]
  assessmentsTruncated: boolean
  referralRewards: ReferralReward[]
  referralRewardsTruncated: boolean
  students: User[]
  studentsTruncated: boolean
  transactions: Transaction[]
  transactionsTruncated: boolean
}

const relationLabel = (
  value: string | AcademicLevel | Subject | User | null | undefined,
): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if ('firstName' in value) return `${value.firstName} ${value.lastName}`.trim()
  return value.name
}

const relationEmail = (value: string | User | null | undefined): string =>
  value && typeof value !== 'string' ? value.email : ''

const asDate = (value: string | null | undefined): Date | null => (value ? new Date(value) : null)

const styleWorksheet = (worksheet: Worksheet) => {
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: { column: 1, row: 1 },
    to: { column: worksheet.columnCount, row: 1 },
  }
  worksheet.getRow(1).height = 24
  worksheet.getRow(1).eachCell((cell) => {
    cell.alignment = { vertical: 'middle' }
    cell.fill = {
      fgColor: { argb: 'FF047857' },
      pattern: 'solid',
      type: 'pattern',
    }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  })
  worksheet.eachRow((row: Row, rowNumber: number) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          fgColor: { argb: 'FFF1F5F3' },
          pattern: 'solid',
          type: 'pattern',
        }
      })
    }
    row.alignment = { vertical: 'top', wrapText: true }
  })
}

const addSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Partial<Column>[],
  rows: Record<string, Date | number | string | null>[],
) => {
  const worksheet = workbook.addWorksheet(name, {
    properties: { defaultRowHeight: 19 },
  })
  worksheet.columns = columns
  worksheet.addRows(rows)
  styleWorksheet(worksheet)
  return worksheet
}

export async function createAdminAnalyticsWorkbook(
  analytics: AdminAnalyticsSnapshot,
  data: AdminAnalyticsExportData,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SmartVision'
  workbook.created = new Date(analytics.generatedAt)
  workbook.modified = new Date(analytics.generatedAt)
  workbook.subject = `SmartVision ${analytics.periodDays}-day administration report`
  workbook.title = 'SmartVision Administration Analytics'

  const summary = addSheet(
    workbook,
    'Summary',
    [
      { header: 'Metric', key: 'metric', width: 34 },
      { header: 'Value', key: 'value', width: 22 },
      { header: 'Context', key: 'context', width: 54 },
    ],
    [
      {
        context: 'All registered accounts with the student role',
        metric: 'Total students',
        value: analytics.metrics.students,
      },
      {
        context: `Registered during the last ${analytics.periodDays} days`,
        metric: 'New students',
        value: analytics.metrics.newStudents,
      },
      {
        context: `${analytics.metrics.onboardedStudents} completed profiles`,
        metric: 'Onboarding completion rate',
        value: analytics.metrics.onboardingRate / 100,
      },
      {
        context: 'Paid subscriptions whose end date is in the future',
        metric: 'Active subscriptions',
        value: analytics.metrics.activeSubscriptions,
      },
      {
        context: `Completed during the last ${analytics.periodDays} days`,
        metric: 'Assessment attempts',
        value: analytics.metrics.assessmentAttempts,
      },
      {
        context: `Calculated from ${analytics.metrics.assessmentSampleSize} exported results`,
        metric: 'Average assessment score',
        value:
          analytics.metrics.averageAssessmentScore === null
            ? null
            : analytics.metrics.averageAssessmentScore / 100,
      },
      {
        context: `Successful transactions during the last ${analytics.periodDays} days`,
        metric: 'Gross payments received (XAF)',
        value: analytics.metrics.grossPayments,
      },
      {
        context: 'Provider fees recorded against successful transactions',
        metric: 'Fapshi payment fees (XAF)',
        value: analytics.metrics.providerFees,
      },
      {
        context: 'Gross payments less provider fees',
        metric: 'Revenue after payment fees (XAF)',
        value: analytics.metrics.revenue,
      },
      {
        context: 'Available and paid rewards earned during the selected period',
        metric: 'Referral rewards (XAF)',
        value: analytics.metrics.referralRewardExpense,
      },
      {
        context: 'Revenue after provider fees and eligible referral rewards',
        metric: 'Platform revenue after referral rewards (XAF)',
        value: analytics.metrics.platformRevenueAfterReferralRewards,
      },
      {
        context: 'Videos, books, exam papers, and question-bank items',
        metric: 'Content items',
        value: analytics.inventory.total,
      },
      {
        context: 'Profiles that still require onboarding',
        metric: 'Incomplete onboarding',
        value: analytics.attention.incompleteOnboarding,
      },
      {
        context: 'Transactions currently created or pending',
        metric: 'Pending payments',
        value: analytics.attention.pendingPayments,
      },
      {
        context: 'Generated by the SmartVision admin dashboard',
        metric: 'Report generated',
        value: new Date(analytics.generatedAt).toISOString(),
      },
    ],
  )
  summary.getCell('B4').numFmt = '0.0%'
  summary.getCell('B7').numFmt = '0.0%'
  for (const rowNumber of [8, 9, 10, 11, 12]) {
    summary.getCell(`B${rowNumber}`).numFmt = '#,##0 "XAF"'
  }

  const students = addSheet(
    workbook,
    'Students',
    [
      { header: 'Student ID', key: 'id', width: 26 },
      { header: 'Name', key: 'name', width: 26 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Academic Level', key: 'academicLevel', width: 24 },
      { header: 'Onboarding', key: 'onboarding', width: 16 },
      { header: 'Account Status', key: 'accountStatus', width: 16 },
      { header: 'Joined', key: 'joined', width: 20 },
      { header: 'Last Active', key: 'lastActive', width: 20 },
    ],
    data.students.map((student) => ({
      academicLevel: relationLabel(student.academicLevel),
      accountStatus: student.isActive === false ? 'Inactive' : 'Active',
      email: student.email,
      id: student.id,
      joined: asDate(student.createdAt),
      lastActive: asDate(student.lastActiveAt),
      name: `${student.firstName} ${student.lastName}`.trim(),
      onboarding: student.onboarded ? 'Complete' : 'Incomplete',
    })),
  )
  students.getColumn('joined').numFmt = 'yyyy-mm-dd hh:mm'
  students.getColumn('lastActive').numFmt = 'yyyy-mm-dd hh:mm'

  const assessments = addSheet(
    workbook,
    'Assessment Results',
    [
      { header: 'Result ID', key: 'id', width: 26 },
      { header: 'Student', key: 'student', width: 26 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Subject', key: 'subject', width: 22 },
      { header: 'Academic Level', key: 'academicLevel', width: 22 },
      { header: 'Test Type', key: 'testType', width: 18 },
      { header: 'Score', key: 'score', width: 13 },
      { header: 'Grade', key: 'grade', width: 11 },
      { header: 'Correct', key: 'correct', width: 11 },
      { header: 'Total Questions', key: 'totalQuestions', width: 16 },
      { header: 'Time Used (min)', key: 'timeUsed', width: 17 },
      { header: 'Completed', key: 'completed', width: 20 },
    ],
    data.assessments.map((result) => ({
      academicLevel: relationLabel(result.academicLevel),
      completed: asDate(result.completedAt),
      correct: result.correctAnswers,
      email: relationEmail(result.user),
      grade: result.grade || '',
      id: result.id,
      score: result.scorePercentage / 100,
      student: relationLabel(result.user),
      subject: relationLabel(result.subject),
      testType: result.testType.replaceAll('_', ' '),
      timeUsed: result.timeUsed,
      totalQuestions: result.totalQuestions,
    })),
  )
  assessments.getColumn('score').numFmt = '0.0%'
  assessments.getColumn('completed').numFmt = 'yyyy-mm-dd hh:mm'

  const transactions = addSheet(
    workbook,
    'Transactions',
    [
      { header: 'Transaction ID', key: 'transactionId', width: 30 },
      { header: 'Student', key: 'student', width: 26 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Plan', key: 'plan', width: 14 },
      { header: 'Amount (XAF)', key: 'amount', width: 18 },
      { header: 'Provider Fee (XAF)', key: 'providerFee', width: 20 },
      { header: 'Revenue (XAF)', key: 'revenue', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment Medium', key: 'paymentMedium', width: 20 },
      { header: 'Initiated', key: 'initiated', width: 20 },
      { header: 'Confirmed', key: 'confirmed', width: 20 },
      { header: 'Reconciled', key: 'reconciled', width: 14 },
    ],
    data.transactions.map((transaction) => ({
      amount: transaction.amount,
      confirmed: asDate(transaction.dateConfirmed),
      email: relationEmail(transaction.user),
      initiated: asDate(transaction.dateInitiated),
      paymentMedium: transaction.paymentMedium || '',
      plan: transaction.plan || '',
      providerFee:
        transaction.providerFeeAmount ??
        Math.max(transaction.amount - (transaction.revenue ?? transaction.amount), 0),
      reconciled: transaction.reconciled ? 'Yes' : 'No',
      revenue: transaction.revenue ?? transaction.amount,
      status: transaction.status || 'created',
      student: relationLabel(transaction.user),
      transactionId: transaction.transactionId,
    })),
  )
  transactions.getColumn('amount').numFmt = '#,##0 "XAF"'
  transactions.getColumn('providerFee').numFmt = '#,##0 "XAF"'
  transactions.getColumn('revenue').numFmt = '#,##0 "XAF"'
  transactions.getColumn('initiated').numFmt = 'yyyy-mm-dd hh:mm'
  transactions.getColumn('confirmed').numFmt = 'yyyy-mm-dd hh:mm'

  const referralRewards = addSheet(
    workbook,
    'Referral Rewards',
    [
      { header: 'Reward ID', key: 'id', width: 26 },
      { header: 'Referrer', key: 'referrer', width: 26 },
      { header: 'Referrer Email', key: 'referrerEmail', width: 34 },
      { header: 'Referred Student', key: 'referredStudent', width: 26 },
      { header: 'Plan', key: 'plan', width: 14 },
      { header: 'Gross Payment (XAF)', key: 'grossPayment', width: 22 },
      { header: 'Fapshi Fee (XAF)', key: 'providerFee', width: 18 },
      { header: 'Revenue (XAF)', key: 'revenue', width: 18 },
      { header: 'Reward Rate', key: 'rewardRate', width: 15 },
      { header: 'Reward (XAF)', key: 'reward', width: 18 },
      { header: 'Platform Revenue (XAF)', key: 'platformRevenue', width: 23 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Ineligibility Reason', key: 'ineligibilityReason', width: 38 },
      { header: 'Settled', key: 'settled', width: 20 },
    ],
    data.referralRewards.map((reward) => ({
      grossPayment: reward.grossPaymentAmount,
      id: reward.id,
      ineligibilityReason: reward.ineligibilityReason || '',
      plan: reward.plan,
      platformRevenue: reward.platformRevenueAfterReward,
      providerFee: reward.providerFeeAmount,
      referrer: relationLabel(reward.referrer),
      referrerEmail: relationEmail(reward.referrer),
      referredStudent: relationLabel(reward.referredUser),
      revenue: reward.revenue,
      reward: reward.rewardAmount,
      rewardRate: reward.rewardRateBasisPoints / 10_000,
      settled: asDate(reward.settledAt),
      status: reward.status,
    })),
  )
  referralRewards.getColumn('grossPayment').numFmt = '#,##0 "XAF"'
  referralRewards.getColumn('providerFee').numFmt = '#,##0 "XAF"'
  referralRewards.getColumn('revenue').numFmt = '#,##0 "XAF"'
  referralRewards.getColumn('rewardRate').numFmt = '0.0%'
  referralRewards.getColumn('reward').numFmt = '#,##0 "XAF"'
  referralRewards.getColumn('platformRevenue').numFmt = '#,##0 "XAF"'
  referralRewards.getColumn('settled').numFmt = 'yyyy-mm-dd hh:mm'

  if (
    data.studentsTruncated ||
    data.assessmentsTruncated ||
    data.transactionsTruncated ||
    data.referralRewardsTruncated
  ) {
    const notes = workbook.addWorksheet('Export Notes')
    notes.columns = [
      { header: 'Dataset', key: 'dataset', width: 28 },
      { header: 'Note', key: 'note', width: 80 },
    ]
    notes.addRows([
      {
        dataset: 'Students',
        note: data.studentsTruncated
          ? 'The export reached the 10,000-row safety limit.'
          : 'Complete for the selected period.',
      },
      {
        dataset: 'Assessment Results',
        note: data.assessmentsTruncated
          ? 'The export reached the 10,000-row safety limit.'
          : 'Complete for the selected period.',
      },
      {
        dataset: 'Transactions',
        note: data.transactionsTruncated
          ? 'The export reached the 10,000-row safety limit.'
          : 'Complete for the selected period.',
      },
      {
        dataset: 'Referral Rewards',
        note: data.referralRewardsTruncated
          ? 'The export reached the 10,000-row safety limit.'
          : 'Complete for the selected period.',
      },
    ])
    styleWorksheet(notes)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
