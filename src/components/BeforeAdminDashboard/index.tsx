import config from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import React, { type CSSProperties } from 'react'

import { getAdminAnalytics } from '@/services/adminAnalytics'
import type { User } from '@/payload-types'
import './styles.css'

const ADMIN_ROLES = ['admin', 'super-admin'] as const

const quickLinks = [
  {
    description: 'Review profiles, onboarding, and account status',
    href: '/admin/collections/users',
    label: 'Students',
  },
  {
    description: 'Upload and organize lesson videos',
    href: '/admin/collections/videos',
    label: 'Video lessons',
  },
  {
    description: 'Manage books and learning PDFs',
    href: '/admin/collections/books',
    label: 'Books',
  },
  {
    description: 'Create and maintain question-bank items',
    href: '/admin/collections/mcq',
    label: 'Question bank',
  },
  {
    description: 'Inspect plans and upcoming expirations',
    href: '/admin/collections/subscriptions',
    label: 'Subscriptions',
  },
  {
    description: 'Review payment status and reconciliation',
    href: '/admin/collections/transactions',
    label: 'Transactions',
  },
  {
    description: 'Inspect scores and assessment attempts',
    href: '/admin/collections/test-results',
    label: 'Test results',
  },
  {
    description: 'Send platform messages to learners',
    href: '/admin/collections/notifications',
    label: 'Notifications',
  },
] as const

const formatCount = (value: number) => new Intl.NumberFormat('en').format(value)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en', {
    currency: 'XAF',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value))

const formatAction = (value: string) =>
  value
    .split('.')
    .map((part) => part.replaceAll('_', ' '))
    .join(' · ')

const BeforeAdminDashboard: React.FC = async () => {
  const payload = await getPayload({ config })
  const requestHeaders = await getHeaders()
  const { user: authenticatedUser } = await payload.auth({ headers: requestHeaders })
  const user = authenticatedUser as User | null

  if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
    return (
      <section className="smartvision-admin-state" aria-live="polite">
        <h1>SmartVision administration</h1>
        <p>Analytics are available to administrators.</p>
      </section>
    )
  }

  try {
    const analytics = await getAdminAnalytics(payload, user)
    const trendMaximum = Math.max(
      1,
      ...analytics.trend.flatMap((point) => [point.assessments, point.newStudents]),
    )

    return (
      <div className="smartvision-admin-dashboard">
        <header className="smartvision-admin-hero">
          <div>
            <p className="smartvision-admin-eyebrow">Platform overview</p>
            <h1 className="smartvision-admin-hero__title">
              Welcome back, {user.firstName || 'Administrator'}
            </h1>
            <p className="smartvision-admin-hero__description">
              Student growth, learning performance, payments, and content health in one place.
            </p>
          </div>
          <div className="smartvision-admin-hero__actions">
            {/* A normal navigation is required so the browser honors Content-Disposition. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              className="smartvision-admin-button smartvision-admin-button--primary"
              href="/api/custom/admin/analytics-export?days=30"
            >
              Export 30-day Excel report
            </a>
            <Link
              className="smartvision-admin-button smartvision-admin-button--secondary"
              href="/dashboard"
            >
              Open student app
            </Link>
          </div>
        </header>

        <section aria-labelledby="overview-heading">
          <div className="smartvision-admin-section-heading">
            <div>
              <p className="smartvision-admin-eyebrow">Last {analytics.periodDays} days</p>
              <h2 id="overview-heading">At a glance</h2>
            </div>
            <p>Updated {formatDateTime(analytics.generatedAt)}</p>
          </div>
          <div className="smartvision-admin-metrics">
            <article className="smartvision-admin-metric">
              <p>Students</p>
              <strong>{formatCount(analytics.metrics.students)}</strong>
              <span>+{formatCount(analytics.metrics.newStudents)} new this period</span>
            </article>
            <article className="smartvision-admin-metric">
              <p>Onboarding complete</p>
              <strong>{analytics.metrics.onboardingRate}%</strong>
              <span>{formatCount(analytics.metrics.onboardedStudents)} student profiles ready</span>
            </article>
            <article className="smartvision-admin-metric">
              <p>Active subscriptions</p>
              <strong>{formatCount(analytics.metrics.activeSubscriptions)}</strong>
              <span>
                {formatCount(analytics.attention.expiringSubscriptions)} expire within 7 days
              </span>
            </article>
            <article className="smartvision-admin-metric">
              <p>Average assessment score</p>
              <strong>
                {analytics.metrics.averageAssessmentScore === null
                  ? '—'
                  : `${analytics.metrics.averageAssessmentScore}%`}
              </strong>
              <span>{formatCount(analytics.metrics.assessmentAttempts)} attempts this period</span>
            </article>
            <article className="smartvision-admin-metric smartvision-admin-metric--revenue">
              <p>Confirmed revenue</p>
              <strong>{formatCurrency(analytics.metrics.revenue)}</strong>
              <span>Successful payments in the last {analytics.periodDays} days</span>
            </article>
          </div>
        </section>

        <div className="smartvision-admin-dashboard__grid">
          <section className="smartvision-admin-panel" aria-labelledby="activity-trend-heading">
            <div className="smartvision-admin-section-heading">
              <div>
                <p className="smartvision-admin-eyebrow">14-day trend</p>
                <h2 id="activity-trend-heading">Learning activity</h2>
              </div>
              <div className="smartvision-admin-chart-legend" aria-label="Chart legend">
                <span>
                  <i className="smartvision-admin-chart-legend__assessments" /> Assessments
                </span>
                <span>
                  <i className="smartvision-admin-chart-legend__students" /> New students
                </span>
              </div>
            </div>
            <div
              className="smartvision-admin-chart"
              aria-label="Assessments and new students over the last 14 days"
            >
              {analytics.trend.map((point) => {
                const assessmentHeight = `${Math.max(
                  point.assessments === 0 ? 2 : 8,
                  (point.assessments / trendMaximum) * 100,
                )}%`
                const studentHeight = `${Math.max(
                  point.newStudents === 0 ? 2 : 8,
                  (point.newStudents / trendMaximum) * 100,
                )}%`

                return (
                  <div className="smartvision-admin-chart__day" key={point.date}>
                    <div className="smartvision-admin-chart__bars">
                      <span
                        className="smartvision-admin-chart__bar smartvision-admin-chart__bar--assessments"
                        style={{ '--bar-height': assessmentHeight } as CSSProperties}
                        title={`${point.assessments} assessments${
                          point.averageScore === null
                            ? ''
                            : `, ${point.averageScore}% average score`
                        }`}
                      />
                      <span
                        className="smartvision-admin-chart__bar smartvision-admin-chart__bar--students"
                        style={{ '--bar-height': studentHeight } as CSSProperties}
                        title={`${point.newStudents} new students`}
                      />
                    </div>
                    <span>{point.label}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section
            className="smartvision-admin-panel smartvision-admin-panel--attention"
            aria-labelledby="attention-heading"
          >
            <div className="smartvision-admin-section-heading">
              <div>
                <p className="smartvision-admin-eyebrow">Follow up</p>
                <h2 id="attention-heading">Needs attention</h2>
              </div>
            </div>
            <div className="smartvision-admin-attention-list">
              <Link href="/admin/collections/users">
                <strong>{formatCount(analytics.attention.incompleteOnboarding)}</strong>
                <span>students have not completed onboarding</span>
              </Link>
              <Link href="/admin/collections/transactions">
                <strong>{formatCount(analytics.attention.pendingPayments)}</strong>
                <span>payments are pending</span>
              </Link>
              <Link href="/admin/collections/transactions">
                <strong>{formatCount(analytics.attention.failedPayments)}</strong>
                <span>payments failed in the last 7 days</span>
              </Link>
              <Link href="/admin/collections/subscriptions">
                <strong>{formatCount(analytics.attention.expiringSubscriptions)}</strong>
                <span>subscriptions expire within 7 days</span>
              </Link>
            </div>
          </section>
        </div>

        <section aria-labelledby="quick-links-heading">
          <div className="smartvision-admin-section-heading">
            <div>
              <p className="smartvision-admin-eyebrow">Common workflows</p>
              <h2 id="quick-links-heading">Quick links</h2>
            </div>
          </div>
          <nav className="smartvision-admin-quick-links" aria-label="Administrative quick links">
            {quickLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                <strong>{link.label}</strong>
                <span>{link.description}</span>
                <i aria-hidden="true">→</i>
              </Link>
            ))}
          </nav>
        </section>

        <div className="smartvision-admin-dashboard__grid">
          <section className="smartvision-admin-panel" aria-labelledby="inventory-heading">
            <div className="smartvision-admin-section-heading">
              <div>
                <p className="smartvision-admin-eyebrow">Published library</p>
                <h2 id="inventory-heading">Content inventory</h2>
              </div>
              <strong>{formatCount(analytics.inventory.total)} items</strong>
            </div>
            <div className="smartvision-admin-inventory">
              {[
                ['Videos', analytics.inventory.videos, '/admin/collections/videos'],
                ['Books', analytics.inventory.books, '/admin/collections/books'],
                ['Exam papers', analytics.inventory.examPapers, '/admin/collections/exam-papers'],
                ['Questions', analytics.inventory.questions, '/admin/collections/mcq'],
              ].map(([label, count, href]) => (
                <Link href={String(href)} key={String(label)}>
                  <strong>{formatCount(Number(count))}</strong>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="smartvision-admin-panel" aria-labelledby="exports-heading">
            <div className="smartvision-admin-section-heading">
              <div>
                <p className="smartvision-admin-eyebrow">Reporting</p>
                <h2 id="exports-heading">Excel exports</h2>
              </div>
            </div>
            <p className="smartvision-admin-panel__description">
              Download a multi-sheet workbook containing the platform summary, student
              onboarding, assessment results, and payment performance. Sensitive authentication,
              birth-date, and payment-phone fields are excluded.
            </p>
            <div className="smartvision-admin-export-actions">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/custom/admin/analytics-export?days=30">Last 30 days</a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/custom/admin/analytics-export?days=90">Last 90 days</a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/custom/admin/analytics-export?days=365">Last 12 months</a>
            </div>
          </section>
        </div>

        <section className="smartvision-admin-panel" aria-labelledby="students-heading">
          <div className="smartvision-admin-section-heading">
            <div>
              <p className="smartvision-admin-eyebrow">Latest registrations</p>
              <h2 id="students-heading">Recent students</h2>
            </div>
            <Link href="/admin/collections/users">View all students</Link>
          </div>
          <div className="smartvision-admin-table-wrap">
            <table className="smartvision-admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Academic level</th>
                  <th>Joined</th>
                  <th>Onboarding</th>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <Link href={`/admin/collections/users/${student.id}`}>{student.name}</Link>
                      <span>{student.email}</span>
                    </td>
                    <td>{student.academicLevel}</td>
                    <td>{formatDate(student.createdAt)}</td>
                    <td>
                      <span
                        className={`smartvision-admin-status smartvision-admin-status--${
                          student.onboarded ? 'success' : 'warning'
                        }`}
                      >
                        {student.onboarded ? 'Complete' : 'Incomplete'}
                      </span>
                    </td>
                    <td>{student.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="smartvision-admin-dashboard__grid">
          <section className="smartvision-admin-panel" aria-labelledby="payments-heading">
            <div className="smartvision-admin-section-heading">
              <div>
                <p className="smartvision-admin-eyebrow">Payment activity</p>
                <h2 id="payments-heading">Recent transactions</h2>
              </div>
              <Link href="/admin/collections/transactions">View all</Link>
            </div>
            <div className="smartvision-admin-feed">
              {analytics.recentTransactions.length === 0 ? (
                <p className="smartvision-admin-empty">No transactions have been recorded.</p>
              ) : (
                analytics.recentTransactions.map((transaction) => (
                  <Link
                    href={`/admin/collections/transactions/${transaction.id}`}
                    key={transaction.id}
                  >
                    <span>
                      <strong>{transaction.userLabel}</strong>
                      <small>
                        {transaction.transactionId} · {formatDateTime(transaction.date)}
                      </small>
                    </span>
                    <span className="smartvision-admin-feed__value">
                      <strong>{formatCurrency(transaction.amount)}</strong>
                      <small
                        className={`smartvision-admin-status smartvision-admin-status--${transaction.status}`}
                      >
                        {transaction.status}
                      </small>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="smartvision-admin-panel" aria-labelledby="activity-heading">
            <div className="smartvision-admin-section-heading">
              <div>
                <p className="smartvision-admin-eyebrow">Audit trail</p>
                <h2 id="activity-heading">Recent activity</h2>
              </div>
              <Link href="/admin/collections/activity-logs">View all</Link>
            </div>
            <div className="smartvision-admin-feed">
              {analytics.recentActivity.length === 0 ? (
                <p className="smartvision-admin-empty">No platform activity has been recorded.</p>
              ) : (
                analytics.recentActivity.map((activity) => (
                  <Link
                    href={`/admin/collections/activity-logs/${activity.id}`}
                    key={activity.id}
                  >
                    <span>
                      <strong>{formatAction(activity.action)}</strong>
                      <small>{activity.description}</small>
                    </span>
                    <span className="smartvision-admin-feed__value">
                      <strong>{activity.userLabel}</strong>
                      <small>{formatDateTime(activity.timestamp)}</small>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    )
  } catch (error) {
    payload.logger.error({
      err: error instanceof Error ? error : new Error(String(error)),
      msg: 'Unable to load admin dashboard analytics',
    })

    return (
      <section className="smartvision-admin-state smartvision-admin-state--error" aria-live="polite">
        <h1>Dashboard analytics are temporarily unavailable</h1>
        <p>You can continue managing content and users from the collection navigation.</p>
      </section>
    )
  }
}

export default BeforeAdminDashboard
