import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  LibraryBig,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getPayload } from 'payload'

import { FAQList, PublicCTA, PublicPrice } from '@/components/PublicSite/PageElements'
import config from '@/payload.config'
import { formatPublicCurrency, getPublicSiteData } from '@/services/publicSite'

const features = [
  {
    description:
      'Follow structured video lessons organised by subject and topic, with protected streaming for subscribed students.',
    href: '/features#lessons',
    icon: PlayCircle,
    title: 'Video lessons',
  },
  {
    description:
      'Read digital books and supporting material from a subject-based library without losing your place.',
    href: '/features#library',
    icon: LibraryBig,
    title: 'Digital library',
  },
  {
    description:
      'Practise with server-scored questions, receive instant results, and review strengths and weak areas.',
    href: '/features#practice',
    icon: ClipboardCheck,
    title: 'Exam practice',
  },
  {
    description:
      'Create a practical study plan around your available time, subjects, goals, and upcoming exams.',
    href: '/features#planning',
    icon: CalendarClock,
    title: 'Study planning',
  },
  {
    description:
      'See learning activity, assessment performance, and topic-level progress from one student dashboard.',
    href: '/features#progress',
    icon: BarChart3,
    title: 'Progress insights',
  },
  {
    description:
      'Invite another student and earn the live referral rate on qualifying subscription payments while active.',
    href: '/features#referrals',
    icon: Users,
    title: 'Referral rewards',
  },
] as const

export default async function HomePage() {
  const [headers, site] = await Promise.all([getHeaders(), getPublicSiteData()])
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })
  const primaryHref = user ? '/dashboard' : '/auth/register'
  const primaryLabel = user ? 'Open your dashboard' : 'Start learning'

  const faqItems = [
    {
      answer:
        'SmartVision is designed around secondary-school learning, including GCE O Level and A Level study needs. Available subjects and resources depend on what the academic team has published for your level.',
      question: 'Who is SmartVision for?',
    },
    {
      answer: `You can create an account and explore the platform before subscribing. Paid access currently costs ${formatPublicCurrency(site.monthlyPrice)} monthly or ${formatPublicCurrency(site.annualPrice)} annually, using the live prices configured by SmartVision.`,
      question: 'How much does a subscription cost?',
    },
    {
      answer:
        'Subscription payments are initiated securely through Fapshi and support MTN Mobile Money and Orange Money. SmartVision confirms the provider transaction before activating access.',
      question: 'How do payments work?',
    },
    {
      answer: site.referralProgramEnabled
        ? `Share your personal referral link. If the referred student makes a successful subscription payment while your own paid subscription is active, you earn ${site.referralRewardPercentage}% of that payment.`
        : 'Referral rewards are currently paused. Existing attribution and reward history remain visible in the student dashboard.',
      question: 'How do referral rewards work?',
    },
    {
      answer:
        'Your learning records and protected content are tied to your account. Premium files and video streams are checked against your current subscription before access is granted.',
      question: 'Is my learning account protected?',
    },
  ]

  return (
    <>
      <section className="public-home-hero">
        <div className="public-shell public-home-hero__grid">
          <div className="public-home-hero__copy">
            <p className="public-eyebrow">Built for focused secondary learning</p>
            <h1>
              Learn. Practise. <span>Progress.</span>
            </h1>
            <p className="public-home-hero__lead">
              Bring lessons, books, exam practice, study planning, and useful progress feedback into
              one focused student workspace.
            </p>
            <div className="public-actions">
              <Link className="public-button" href={primaryHref}>
                {primaryLabel} <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className="public-button public-button--secondary" href="/features">
                Explore the platform
              </Link>
            </div>
            <div className="public-home-hero__meta">
              <span>
                <ShieldCheck aria-hidden="true" size={16} /> Protected learning content
              </span>
              <span>
                <CheckCircle2 aria-hidden="true" size={16} /> MTN & Orange Money
              </span>
              <span>
                <Sparkles aria-hidden="true" size={16} /> Personal study planning
              </span>
            </div>
          </div>

          <div
            aria-label="Secondary students studying together with books and a laptop"
            className="public-product-preview public-product-preview--editorial"
          >
            <div className="public-preview-window">
              <div className="public-preview-window__top">
                <i />
                <i />
                <i />
              </div>
              <div className="public-preview-window__body">
                <aside className="public-preview-sidebar" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </aside>
                <div className="public-preview-main">
                  <span />
                  <span />
                  <div className="public-preview-focus">
                    <article>
                      <strong>Continue learning</strong>
                      <small>Physics · Forces and motion</small>
                      <div className="public-preview-progress">
                        <i />
                      </div>
                    </article>
                    <article>
                      <strong>Practice goal</strong>
                      <small>10 questions today</small>
                      <div className="public-preview-progress">
                        <i />
                      </div>
                    </article>
                  </div>
                  <div className="public-preview-focus">
                    <article>
                      <strong>Study plan</strong>
                      <small>Mathematics revision · 6:00 PM</small>
                    </article>
                    <article>
                      <strong>Recent score</strong>
                      <small>Biology practice · 82%</small>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-trust-row" aria-label="Platform highlights">
        <div className="public-shell public-trust-row__inner">
          <article>
            <strong>Video + reading</strong>
            <span>Learn in the format that fits</span>
          </article>
          <article>
            <strong>Server-scored practice</strong>
            <span>Reliable feedback after each test</span>
          </article>
          <article>
            <strong>Mobile money</strong>
            <span>MTN and Orange supported</span>
          </article>
          <article>
            <strong>One student dashboard</strong>
            <span>Plans, progress, and resources</span>
          </article>
        </div>
      </section>

      <section className="public-section">
        <div className="public-shell">
          <div className="public-section-heading">
            <p className="public-eyebrow">Everything in one place</p>
            <h2>A learning system, not another folder of files.</h2>
            <p>
              Each part of SmartVision is connected to help students move from understanding a topic
              to practising it and seeing what needs attention next.
            </p>
          </div>
          <div className="public-feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article className="public-feature-card" key={feature.title}>
                  <span className="public-feature-card__icon">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <Link href={feature.href}>
                    Learn more <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="public-section public-section--muted">
        <div className="public-shell public-split">
          <div className="public-split__content">
            <p className="public-eyebrow">Feedback you can use</p>
            <h2>Turn every practice session into a clearer next step.</h2>
            <p>
              SmartVision scores tests on the server, records the result, and helps students see
              where performance is strong and where another revision session will matter.
            </p>
            <ul className="public-check-list">
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                Practice questions matched to academic level, subject, and topic.
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                Immediate scores with correct-answer and explanation review.
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                Progress history that remains connected to the student account.
              </li>
            </ul>
          </div>
          <div className="public-insight-card" aria-label="Example assessment insight">
            <div className="public-insight-card__header">
              <strong>Practice insight</strong>
              <span>Mathematics</span>
            </div>
            <div className="public-insight-card__score">
              <strong>82%</strong>
              <small>Score</small>
            </div>
            <div className="public-insight-card__bars">
              {[
                ['Algebra', '88%', '88%'],
                ['Geometry', '74%', '74%'],
                ['Statistics', '81%', '81%'],
              ].map(([label, value, progress]) => (
                <div key={label}>
                  <span>{label}</span>
                  <i style={{ '--progress': progress } as CSSProperties} />
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-shell">
          <div className="public-section-heading">
            <p className="public-eyebrow">A simple learning rhythm</p>
            <h2>Choose a goal. Follow the plan. Adjust with evidence.</h2>
          </div>
          <div className="public-process-grid">
            <article>
              <span>1</span>
              <h3>Set up your learning profile</h3>
              <p>
                Select your academic level, subjects, interests, and study preferences so the
                dashboard starts in the right context.
              </p>
            </article>
            <article>
              <span>2</span>
              <h3>Learn and practise</h3>
              <p>
                Work through videos and books, then use question banks and practice tests to check
                your understanding.
              </p>
            </article>
            <article>
              <span>3</span>
              <h3>Review and improve</h3>
              <p>
                Use progress and test results to focus the next study plan on the topics that need
                more attention.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="public-section public-section--muted" id="plans">
        <div className="public-shell public-split">
          <div className="public-split__content">
            <p className="public-eyebrow">Straightforward access</p>
            <h2>Choose monthly flexibility or annual value.</h2>
            <p>
              Current subscription prices come directly from SmartVision&apos;s live platform
              settings. Payment confirmation activates access only after Fapshi verifies the
              transaction.
            </p>
            <div className="public-actions">
              <Link className="public-button" href="/pricing">
                Compare plans <ArrowRight aria-hidden="true" size={18} />
              </Link>
            </div>
          </div>
          <div className="public-content-grid">
            <article className="public-content-card">
              <BookOpen aria-hidden="true" color="rgb(var(--primary))" />
              <h3>Monthly</h3>
              <PublicPrice value={site.monthlyPrice} />
              <p>Full subscribed access for one month.</p>
            </article>
            <article className="public-content-card">
              <Sparkles aria-hidden="true" color="rgb(var(--success))" />
              <h3>Annual</h3>
              <PublicPrice value={site.annualPrice} />
              <p>Full subscribed access for one year.</p>
            </article>
          </div>
        </div>
      </section>

      {site.referralProgramEnabled ? (
        <section className="public-section" id="referrals">
          <div className="public-shell public-split">
            <div className="public-insight-card">
              <div className="public-insight-card__header">
                <strong>Referral rewards</strong>
                <Users aria-hidden="true" size={22} />
              </div>
              <p className="public-price-card__price">{site.referralRewardPercentage}%</p>
              <p>of each qualifying referred student&apos;s successful subscription payment.</p>
              <ul className="public-check-list">
                <li>
                  <CheckCircle2 aria-hidden="true" size={19} />
                  Share your signed personal referral link.
                </li>
                <li>
                  <CheckCircle2 aria-hidden="true" size={19} />
                  Keep your own paid subscription active.
                </li>
                <li>
                  <CheckCircle2 aria-hidden="true" size={19} />
                  Track earned and missed bonuses in your dashboard.
                </li>
              </ul>
            </div>
            <div className="public-split__content">
              <p className="public-eyebrow">Learn together</p>
              <h2>Recommend SmartVision and earn while you remain active.</h2>
              <p>
                Referral attribution and rewards are recorded against verified subscription
                payments. If your subscription is inactive when a referred payment settles,
                SmartVision records the missed bonus and sends you a renewal notification.
              </p>
              <Link className="public-button public-button--secondary" href="/features#referrals">
                See referral rules
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="public-section public-section--muted">
        <div className="public-shell">
          <div className="public-section-heading">
            <p className="public-eyebrow">Common questions</p>
            <h2>Know what to expect before you begin.</h2>
          </div>
          <FAQList items={faqItems} />
          <div className="public-actions" style={{ marginTop: '1.5rem' }}>
            <Link className="public-button public-button--secondary" href="/faq">
              Read all FAQs
            </Link>
          </div>
        </div>
      </section>

      <PublicCTA description="Create your profile, choose your academic level, and bring lessons, practice, planning, and progress into one place." />
    </>
  )
}
