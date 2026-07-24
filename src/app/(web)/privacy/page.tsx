import type { Metadata } from 'next'
import Link from 'next/link'

import { PublicPageHero } from '@/components/PublicSite/PageElements'
import { getPublicSiteData } from '@/services/publicSite'

export const metadata: Metadata = {
  description:
    'How SmartVision collects, uses, protects, and lets students manage account and learning information.',
  title: 'Privacy',
}

export default async function PrivacyPage() {
  const site = await getPublicSiteData()

  return (
    <>
      <PublicPageHero
        description="This page explains the main information SmartVision uses to provide accounts, learning, subscriptions, referrals, and platform security."
        eyebrow="Privacy"
        title="Your learning data, explained clearly."
      />

      <section className="public-section">
        <article className="public-shell public-legal">
          <p>
            <strong>Last updated:</strong> July 24, 2026
          </p>

          <h2>Information SmartVision processes</h2>
          <p>
            SmartVision processes account details such as name, email address, password-derived
            authentication information, academic profile, and account status. Onboarding may request
            date of birth to support age-aware account administration and appropriate student
            experiences. Date of birth is not included in public profiles or routine analytics
            exports.
          </p>
          <p>
            The platform also records learning activity, test sessions and results, study plans,
            downloads, notifications, subscriptions, payment references, referral attribution,
            reward records, active sessions, and security or audit events.
          </p>

          <h2>How the information is used</h2>
          <ul>
            <li>Provide and secure the student account.</li>
            <li>Match learning resources and practice to the selected academic context.</li>
            <li>Record progress, results, plans, and account preferences.</li>
            <li>Verify subscription payments and control premium-content access.</li>
            <li>Attribute referrals and calculate eligible or missed bonuses.</li>
            <li>Detect abuse, investigate errors, reconcile records, and operate the service.</li>
          </ul>

          <h2>Payments</h2>
          <p>
            Mobile-money payments are initiated through Fapshi. SmartVision stores provider and
            internal transaction references, amount, status, plan, payment medium, fee and revenue
            records, and confirmation timestamps needed to reconcile access. Do not send SmartVision
            your mobile-money PIN or one-time approval code.
          </p>

          <h2>Content and storage</h2>
          <p>
            Learning media may be stored in Cloudflare R2. Protected resources are delivered only
            after SmartVision checks the signed-in user, relevant content relationship, and current
            entitlement. Short-lived delivery links reduce direct exposure of protected files.
          </p>

          <h2>Sharing and service providers</h2>
          <p>
            Information is shared only as needed with infrastructure, storage, email, payment, and
            other service providers that help operate SmartVision, or when required to protect
            users, comply with lawful obligations, or enforce platform rules.
          </p>

          <h2>Your choices</h2>
          <p>
            Signed-in students can review and update supported profile fields, inspect and revoke
            active sessions, request a personal data export, deactivate their account, or request
            deletion through account settings. Some financial, security, or audit records may need
            to be retained for reconciliation, fraud prevention, or legal obligations.
          </p>

          <h2>Security</h2>
          <p>
            SmartVision uses email verification, password requirements, session controls, role-based
            access, server-side assessment scoring, payment re-verification, signed referral
            attribution, and entitlement checks. No system is risk-free, so students should use a
            unique password and report unexpected activity promptly.
          </p>

          <h2>Contact</h2>
          <p>
            Privacy questions and account requests can be sent to{' '}
            <a href={`mailto:${site.email}`}>{site.email}</a>. See the{' '}
            <Link href="/contact">contact page</Link> for safe information to include.
          </p>
        </article>
      </section>
    </>
  )
}
