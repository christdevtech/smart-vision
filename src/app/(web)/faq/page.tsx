import type { Metadata } from 'next'
import Link from 'next/link'

import { FAQList, PublicCTA, PublicPageHero } from '@/components/PublicSite/PageElements'
import { formatPublicCurrency, getPublicSiteData } from '@/services/publicSite'

export const metadata: Metadata = {
  description:
    'Answers about SmartVision accounts, learning resources, subscriptions, payments, referrals, progress, and privacy.',
  title: 'FAQs',
}

export default async function FAQPage() {
  const site = await getPublicSiteData()
  const groups = [
    {
      items: [
        {
          answer:
            'Create an account with your email and a strong password, verify your email, then complete the onboarding steps for your academic level and learning preferences.',
          question: 'How do I create a student account?',
        },
        {
          answer:
            'Use the password-reset option on the sign-in page. SmartVision sends a time-limited reset link to the account email address.',
          question: 'What if I forget my password?',
        },
        {
          answer:
            'Yes. Account settings include active-session management, profile controls, a personal data export, and account closure options.',
          question: 'Can I manage my account and data?',
        },
      ],
      title: 'Accounts and onboarding',
    },
    {
      items: [
        {
          answer:
            'The platform supports published video lessons, digital books, exam papers, question banks, practice tests, study plans, and progress views. Availability varies by academic level and published content.',
          question: 'What learning resources are available?',
        },
        {
          answer:
            'Choose a subject, topic, difficulty, and question count. SmartVision creates a time-limited session and scores submitted answers on the server.',
          question: 'How do practice tests work?',
        },
        {
          answer:
            'Progress records come from validated video or reading activity and completed assessment results. They are connected to your signed-in account.',
          question: 'How is progress tracked?',
        },
      ],
      title: 'Learning and practice',
    },
    {
      items: [
        {
          answer: `The live configured prices are ${formatPublicCurrency(site.monthlyPrice)} for monthly access and ${formatPublicCurrency(site.annualPrice)} for annual access.`,
          question: 'What are the current subscription prices?',
        },
        {
          answer:
            'SmartVision supports MTN Mobile Money and Orange Money through Fapshi. Payment is checked with the provider before subscription access is activated.',
          question: 'Which payment methods can I use?',
        },
        {
          answer:
            'Open the subscription page from your dashboard, select a plan, enter the supported mobile-money number, and follow the approval request on your phone.',
          question: 'How do I renew?',
        },
        {
          answer:
            'If a payment remains pending or fails, do not repeatedly approve unexpected requests. Check the transaction status in SmartVision and contact support with the transaction reference when needed.',
          question: 'What should I do if payment does not complete?',
        },
      ],
      title: 'Subscriptions and payments',
    },
    {
      items: [
        {
          answer: site.referralProgramEnabled
            ? `Open the referral dashboard and share your personal link. A successful referred-student subscription payment can earn ${site.referralRewardPercentage}% while your own paid subscription is active.`
            : 'Referral rewards are currently paused. Your existing attribution and reward records remain available.',
          question: 'How do I earn a referral reward?',
        },
        {
          answer:
            'Your paid monthly or annual subscription must be active when the referred student payment is verified and settled.',
          question: 'When am I eligible?',
        },
        {
          answer:
            'The reward is recorded as ineligible with a zero earned amount, and SmartVision sends you a notification showing the bonus you missed and a link to renew for future referrals.',
          question: 'What happens if my subscription is inactive?',
        },
        {
          answer:
            'The referral dashboard shows total referrals, qualified referrals, available earnings, paid earnings, and recent reward history. Cash payout requires a separate reviewed payout process.',
          question: 'Where can I see reward records?',
        },
      ],
      title: 'Referral rewards',
    },
    {
      items: [
        {
          answer:
            'Premium resources are checked against the signed-in student, subscription, related lesson or resource, and a short-lived access grant before delivery.',
          question: 'How is premium content protected?',
        },
        {
          answer:
            'SmartVision uses account, learning, payment, and operational records to provide the platform, secure access, reconcile payments, and improve the service. See the privacy page for more detail.',
          question: 'How is my information used?',
        },
      ],
      title: 'Privacy and security',
    },
  ]

  return (
    <>
      <PublicPageHero
        actions={
          <Link className="public-button public-button--secondary" href="/contact">
            Contact support
          </Link>
        }
        description="Clear answers about accounts, content, subscriptions, payments, referrals, progress, and privacy."
        eyebrow="Frequently asked questions"
        title="Find the answer without searching the whole platform."
      />

      {groups.map((group, index) => (
        <section
          className={`public-section ${index % 2 === 1 ? 'public-section--muted' : ''}`}
          key={group.title}
        >
          <div className="public-shell">
            <div className="public-section-heading">
              <p className="public-eyebrow">Help centre</p>
              <h2>{group.title}</h2>
            </div>
            <FAQList items={group.items} />
          </div>
        </section>
      ))}

      <PublicCTA description="If your question is specific to an account or transaction, sign in first so you can provide the relevant reference safely." />
    </>
  )
}
