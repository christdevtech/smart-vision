import { CheckCircle2, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  FAQList,
  PublicCTA,
  PublicPageHero,
  PublicPrice,
} from '@/components/PublicSite/PageElements'
import { formatPublicCurrency, getPublicSiteData } from '@/services/publicSite'

export const metadata: Metadata = {
  description:
    'Compare SmartVision free, monthly, and annual access. Pay securely with MTN Mobile Money or Orange Money.',
  title: 'Pricing',
}

const paidFeatures = [
  'Subscribed video lessons and protected learning content',
  'Digital books and eligible exam resources',
  'Practice testing with saved results',
  'Study planning and progress insights',
  'Referral reward eligibility while the subscription remains active',
] as const

export default async function PricingPage() {
  const site = await getPublicSiteData()
  const monthlyAnnualCost = site.monthlyPrice * 12
  const annualSaving = Math.max(monthlyAnnualCost - site.annualPrice, 0)

  const faqItems = [
    {
      answer:
        'Create an account, complete your profile, and use the subscription area to choose monthly or annual access. The displayed prices come from the same live settings used during checkout.',
      question: 'How do I subscribe?',
    },
    {
      answer:
        'SmartVision supports MTN Mobile Money and Orange Money through Fapshi. Access is activated after SmartVision verifies the completed provider transaction.',
      question: 'Which payment methods are supported?',
    },
    {
      answer:
        'Your subscription remains active until its recorded end date. You can purchase another monthly or annual period from the subscription area.',
      question: 'How does renewal work?',
    },
    {
      answer: site.referralProgramEnabled
        ? `Yes. Active paid subscribers may earn ${site.referralRewardPercentage}% of qualifying referred-student subscription payments.`
        : 'The referral reward program is currently paused.',
      question: 'Can subscribers earn referral rewards?',
    },
  ]

  return (
    <>
      <PublicPageHero
        description="Start with an account, then choose the access period that fits your study plan. Prices below are read from SmartVision's live subscription settings."
        eyebrow="Simple pricing"
        title="Focused learning at a clear price."
      />

      <section className="public-section">
        <div className="public-shell public-pricing-grid">
          <article className="public-price-card">
            <h3>Student account</h3>
            <p className="public-price-card__price">Free</p>
            <p>Set up your account and explore the student experience before subscribing.</p>
            <ul className="public-check-list">
              {[
                'Personal student profile',
                'Dashboard and account settings',
                'Published free resources',
                'Subscription and referral overview',
              ].map((feature) => (
                <li key={feature}>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <Link className="public-button public-button--secondary" href="/auth/register">
              Create account
            </Link>
          </article>

          <article className="public-price-card">
            <h3>Monthly</h3>
            <PublicPrice value={site.monthlyPrice} />
            <p>Full subscribed access for one month from activation.</p>
            <ul className="public-check-list">
              {paidFeatures.map((feature) => (
                <li key={feature}>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <Link className="public-button public-button--secondary" href="/auth/register">
              Choose monthly
            </Link>
          </article>

          <article className="public-price-card public-price-card--featured">
            <span className="public-price-card__badge">Best continuity</span>
            <h3>Annual</h3>
            <PublicPrice value={site.annualPrice} />
            <p>
              Full subscribed access for one year.
              {annualSaving > 0
                ? ` Save ${formatPublicCurrency(annualSaving)} compared with twelve monthly periods.`
                : ''}
            </p>
            <ul className="public-check-list">
              {paidFeatures.map((feature) => (
                <li key={feature}>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <Link className="public-button public-button--light" href="/auth/register">
              Choose annual
            </Link>
          </article>
        </div>
      </section>

      <section className="public-section public-section--muted">
        <div className="public-shell public-split">
          <div className="public-split__content">
            <p className="public-eyebrow">Payment confidence</p>
            <h2>Access changes only after payment verification.</h2>
            <p>
              SmartVision re-checks the Fapshi transaction before settling it, records gross payment
              and revenue, and applies a subscription settlement only once.
            </p>
          </div>
          <article className="public-content-card">
            <ShieldCheck aria-hidden="true" color="rgb(var(--success))" size={34} />
            <h3>Supported payment flow</h3>
            <p>
              Use a valid Cameroon MTN or Orange Money number. Complete the approval request on your
              phone, then return to SmartVision while the payment is confirmed.
            </p>
          </article>
        </div>
      </section>

      <section className="public-section">
        <div className="public-shell">
          <div className="public-section-heading">
            <p className="public-eyebrow">Pricing FAQs</p>
            <h2>Questions about access and payment.</h2>
          </div>
          <FAQList items={faqItems} />
        </div>
      </section>

      <PublicCTA
        description="Create your student account first. You can choose and pay for a plan from the secure subscription area."
        title="Start with the account. Subscribe when you are ready."
      />
    </>
  )
}
