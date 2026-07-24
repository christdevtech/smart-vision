import type { Metadata } from 'next'
import Link from 'next/link'

import { PublicPageHero } from '@/components/PublicSite/PageElements'
import { getPublicSiteData } from '@/services/publicSite'

export const metadata: Metadata = {
  description:
    'Terms for using SmartVision accounts, educational content, subscriptions, payments, and referral rewards.',
  title: 'Terms',
}

export default async function TermsPage() {
  const site = await getPublicSiteData()

  return (
    <>
      <PublicPageHero
        description="These terms describe the basic rules for using SmartVision accounts, learning resources, subscriptions, payments, and referral rewards."
        eyebrow="Terms of use"
        title="Clear rules for a shared learning platform."
      />

      <section className="public-section">
        <article className="public-shell public-legal">
          <p>
            <strong>Last updated:</strong> July 24, 2026
          </p>

          <h2>Using SmartVision</h2>
          <p>
            You must provide accurate account information, protect your sign-in credentials, and use
            the platform for lawful educational purposes. You are responsible for activity through
            your account unless you promptly report unauthorised access.
          </p>

          <h2>Student accounts</h2>
          <p>
            SmartVision may require email verification and completion of academic onboarding.
            Accounts may be restricted or deactivated when information is fraudulent, security is
            compromised, payment abuse occurs, or the platform is used to harm other users or the
            service.
          </p>

          <h2>Learning content</h2>
          <p>
            Books, videos, questions, exam resources, and related materials are provided for
            personal study. Unless a resource explicitly permits it, you may not redistribute,
            resell, scrape, publicly share, bypass protection for, or make unauthorised copies of
            premium content.
          </p>

          <h2>Subscriptions and payments</h2>
          <p>
            Current plan prices are shown on the <Link href="/pricing">pricing page</Link> and at
            checkout. Subscription access begins only after the payment provider confirms the
            transaction and SmartVision settles it. A monthly or annual subscription remains active
            until its recorded end date.
          </p>
          <p>
            Do not approve a mobile-money request you did not initiate. Payment reversals, refunds,
            disputes, or provider corrections may change the associated subscription and referral
            reward records.
          </p>

          <h2>Referral rewards</h2>
          <p>
            When enabled, the current referral rate is shown in the platform and comes from
            SmartVision&apos;s global settings. A reward requires valid attribution, a verified
            referred-student subscription payment, an active referrer account, and an active paid
            monthly or annual subscription for the referrer at settlement time.
          </p>
          <p>
            Inactive referrers do not earn the otherwise calculated bonus. SmartVision records the
            missed event and may notify the referrer. Reward records represent accrued platform
            balances; they are not a promise of immediate cash transfer. Any payout is subject to
            destination verification, minimums, review, provider availability, reconciliation, and
            applicable compliance requirements.
          </p>

          <h2>Practice results and study guidance</h2>
          <p>
            SmartVision provides educational tools and performance feedback, not a guarantee of a
            particular examination result. Students remain responsible for their study decisions,
            official syllabus requirements, and examination registration.
          </p>

          <h2>Service availability</h2>
          <p>
            SmartVision may change, add, suspend, or remove features and content as the academic
            catalogue and platform evolve. Maintenance, provider outages, connectivity, or security
            work can temporarily affect access.
          </p>

          <h2>Privacy and contact</h2>
          <p>
            Use of personal information is described on the{' '}
            <Link href="/privacy">privacy page</Link>. Questions about these terms can be sent to{' '}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
        </article>
      </section>
    </>
  )
}
