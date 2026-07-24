import Link from 'next/link'
import type { ReactNode } from 'react'

export function PublicPageHero({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <section className="public-page-hero">
      <div className="public-shell public-page-hero__inner">
        <p className="public-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {actions ? <div className="public-actions">{actions}</div> : null}
      </div>
    </section>
  )
}

export function PublicCTA({
  description,
  title = 'Build a study routine that works for you.',
}: {
  description: string
  title?: string
}) {
  return (
    <section className="public-shell public-cta">
      <div>
        <p className="public-eyebrow">Ready when you are</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="public-actions">
        <Link className="public-button public-button--light" href="/auth/register">
          Create an account
        </Link>
        <Link className="public-button public-button--ghost-light" href="/auth/login">
          Sign in
        </Link>
      </div>
    </section>
  )
}

export function FAQList({ items }: { items: Array<{ answer: ReactNode; question: string }> }) {
  return (
    <div className="public-faq-list">
      {items.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <div>{item.answer}</div>
        </details>
      ))}
    </div>
  )
}
