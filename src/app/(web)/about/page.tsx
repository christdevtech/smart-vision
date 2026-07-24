import { BookOpenCheck, Compass, ShieldCheck, Target, Users } from 'lucide-react'
import type { Metadata } from 'next'

import { PublicCTA, PublicPageHero } from '@/components/PublicSite/PageElements'

export const metadata: Metadata = {
  description:
    'Learn why SmartVision brings structured learning, practice, planning, and progress support together for secondary students.',
  title: 'About',
}

export default function AboutPage() {
  return (
    <>
      <PublicPageHero
        description="SmartVision is a learning platform for secondary students who need more than scattered resources: they need a clear way to learn, practise, plan, and improve."
        eyebrow="About SmartVision"
        title="Helping students turn effort into progress."
      />

      <section className="public-section">
        <div className="public-shell public-split">
          <div className="public-split__content">
            <p className="public-eyebrow">Our purpose</p>
            <h2>Make focused learning easier to begin and easier to sustain.</h2>
            <p>
              Students often move between videos, documents, handwritten schedules, and practice
              questions without a reliable view of what they have completed or what to do next.
              SmartVision brings those activities into one account and one learning rhythm.
            </p>
            <p>
              The platform is designed with Cameroon&apos;s secondary-school context and mobile
              money access in mind, including support for GCE-oriented study needs and MTN or Orange
              Money subscription payments.
            </p>
          </div>
          <div className="public-content-grid">
            <article className="public-content-card">
              <Target aria-hidden="true" color="rgb(var(--primary))" />
              <h3>Direction</h3>
              <p>Help each student identify the right subject, topic, resource, and next action.</p>
            </article>
            <article className="public-content-card">
              <BookOpenCheck aria-hidden="true" color="rgb(var(--success))" />
              <h3>Understanding</h3>
              <p>Connect lessons and reading with practice that confirms genuine understanding.</p>
            </article>
            <article className="public-content-card">
              <Compass aria-hidden="true" color="rgb(var(--primary))" />
              <h3>Consistency</h3>
              <p>Make planning and progress review part of the normal learning experience.</p>
            </article>
            <article className="public-content-card">
              <ShieldCheck aria-hidden="true" color="rgb(var(--success))" />
              <h3>Trust</h3>
              <p>Protect student records, premium content, and payment outcomes on the server.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="public-section public-section--muted">
        <div className="public-shell">
          <div className="public-section-heading">
            <p className="public-eyebrow">How we build</p>
            <h2>Four principles behind the platform.</h2>
          </div>
          <div className="public-feature-grid">
            {[
              {
                description:
                  'A feature should reduce uncertainty about what to learn, how to practise, or what to do next.',
                title: 'Clarity before complexity',
              },
              {
                description:
                  'Progress, assessment scores, referrals, and payments should come from verifiable server-side records.',
                title: 'Evidence over guesswork',
              },
              {
                description:
                  'The interface should remain understandable on the phones and connections students already use.',
                title: 'Accessible by default',
              },
              {
                description:
                  'Students should know why access, rewards, and account information behave the way they do.',
                title: 'Transparent rules',
              },
              {
                description:
                  'Administrators need operational views that make student, content, payment, and learning issues visible.',
                title: 'Operable, not opaque',
              },
              {
                description:
                  'The product should improve through reliable feedback, measured learning behaviour, and careful iteration.',
                title: 'Continuous improvement',
              },
            ].map((principle) => (
              <article className="public-feature-card" key={principle.title}>
                <span className="public-feature-card__icon">
                  <Users aria-hidden="true" size={22} />
                </span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublicCTA description="Create an account, complete your academic profile, and start with the subject that matters most today." />
    </>
  )
}
