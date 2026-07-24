import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  LibraryBig,
  PlayCircle,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PublicCTA, PublicPageHero } from '@/components/PublicSite/PageElements'
import { getPublicSiteData } from '@/services/publicSite'

export const metadata: Metadata = {
  description:
    'Explore SmartVision video lessons, digital books, question banks, study planning, progress tracking, and referral rewards.',
  title: 'Features',
}

const learningFeatures = [
  {
    description:
      'Browse lessons by academic level, subject, and topic. Subscribed content is delivered through short-lived, entitlement-checked streams.',
    icon: PlayCircle,
    id: 'lessons',
    title: 'Protected video lessons',
  },
  {
    description:
      'Find books and learning documents by subject, then read eligible materials from the signed-in student experience.',
    icon: LibraryBig,
    id: 'library',
    title: 'Digital subject library',
  },
  {
    description:
      'Work with exam papers and question-bank resources designed to complement lessons and independent revision.',
    icon: BookOpen,
    id: 'exam-resources',
    title: 'Exam resources',
  },
] as const

const practiceFeatures = [
  {
    description:
      'Start a timed practice session for the selected level, subject, topic, difficulty, and question count.',
    icon: ClipboardCheck,
    id: 'practice',
    title: 'Server-scored practice tests',
  },
  {
    description:
      'Review scores, correct and incorrect answers, explanations, grades, and topic-level strengths or weaknesses.',
    icon: BrainCircuit,
    id: 'feedback',
    title: 'Useful result feedback',
  },
  {
    description:
      'See recorded learning activity and assessment outcomes without relying on self-reported progress.',
    icon: BarChart3,
    id: 'progress',
    title: 'Trusted progress records',
  },
] as const

export default async function FeaturesPage() {
  const site = await getPublicSiteData()

  return (
    <>
      <PublicPageHero
        actions={
          <>
            <Link className="public-button" href="/auth/register">
              Create an account
            </Link>
            <Link className="public-button public-button--secondary" href="/pricing">
              View pricing
            </Link>
          </>
        }
        description="From first lesson to final review, SmartVision connects the resources and feedback students need to keep moving."
        eyebrow="Platform features"
        image={{
          alt: 'A secondary student studying with a laptop, notebook, and textbook',
          src: '/images/smartvision-focused-study.webp',
        }}
        title="One connected workspace for serious study."
      />

      <section className="public-section">
        <div className="public-shell">
          <div className="public-section-heading">
            <p className="public-eyebrow">Learn</p>
            <h2>Understand the topic before you test yourself.</h2>
            <p>
              Content is organised around the student&apos;s academic context, making it easier to
              move between explanations, reference material, and revision resources.
            </p>
          </div>
          <div className="public-feature-grid">
            {learningFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <article className="public-feature-card" id={feature.id} key={feature.id}>
                  <span className="public-feature-card__icon">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="public-section public-section--muted">
        <div className="public-shell">
          <div className="public-section-heading">
            <p className="public-eyebrow">Practise</p>
            <h2>Get feedback that reflects what you actually answered.</h2>
            <p>
              Questions and scoring remain server-authoritative, while the student interface stays
              fast and straightforward.
            </p>
          </div>
          <div className="public-feature-grid">
            {practiceFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <article className="public-feature-card" id={feature.id} key={feature.id}>
                  <span className="public-feature-card__icon">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-shell public-split">
          <div className="public-split__content" id="planning">
            <p className="public-eyebrow">Plan</p>
            <h2>Turn available time into a realistic study schedule.</h2>
            <p>
              Build a study plan around subjects, preferred session length, available days, and exam
              goals. The planner helps transform a broad intention into concrete sessions.
            </p>
            <ul className="public-check-list">
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                Create, review, and manage study plans from the student dashboard.
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                Keep revision, practice, and learning sessions in one schedule.
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                Receive reminders and return directly to relevant platform areas.
              </li>
            </ul>
          </div>
          <div className="public-content-grid">
            <article className="public-content-card">
              <CalendarClock aria-hidden="true" color="rgb(var(--primary))" />
              <h3>Study planner</h3>
              <p>Organise sessions around your real weekly availability and academic priorities.</p>
            </article>
            <article className="public-content-card">
              <Download aria-hidden="true" color="rgb(var(--success))" />
              <h3>Personal downloads</h3>
              <p>
                Keep permitted student resources organised in the downloads area of your account.
              </p>
            </article>
            <article className="public-content-card">
              <ShieldCheck aria-hidden="true" color="rgb(var(--primary))" />
              <h3>Protected access</h3>
              <p>
                Subscription and ownership checks protect premium learning resources and records.
              </p>
            </article>
            <article className="public-content-card">
              <BarChart3 aria-hidden="true" color="rgb(var(--success))" />
              <h3>Progress overview</h3>
              <p>Bring learning activity and assessment performance into one reviewable view.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="public-section public-section--muted" id="referrals">
        <div className="public-shell public-split">
          <div className="public-split__content">
            <p className="public-eyebrow">Referral rewards</p>
            <h2>
              {site.referralProgramEnabled
                ? `Earn ${site.referralRewardPercentage}% on qualifying referred payments.`
                : 'Referral rewards are currently paused.'}
            </h2>
            <p>
              Share the personal link in your referral dashboard. Attribution is signed and recorded
              at registration, and rewards are evaluated only after a subscription payment is
              verified.
            </p>
          </div>
          <article className="public-content-card">
            <Users aria-hidden="true" color="rgb(var(--primary))" size={30} />
            <h3>Eligibility matters</h3>
            <p>
              Your own paid monthly or annual subscription must be active when the referred
              student&apos;s payment settles. If it is inactive, the missed bonus is recorded and
              you receive a renewal notification.
            </p>
            <Link className="public-button public-button--secondary" href="/dashboard/referrals">
              Open referral dashboard
            </Link>
          </article>
        </div>
      </section>

      <PublicCTA description="Start with your academic profile, then use the parts of SmartVision that match what you need to learn today." />
    </>
  )
}
