import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { FAQAccordion } from './FAQAccordion'

export function PublicPageHero({
  actions,
  description,
  eyebrow,
  image,
  title,
}: {
  actions?: ReactNode
  description: string
  eyebrow: string
  image?: {
    alt: string
    src: string
  }
  title: string
}) {
  return (
    <section className="public-page-hero">
      <div
        className={`public-shell public-page-hero__inner ${
          image ? 'public-page-hero__inner--visual' : ''
        }`}
      >
        <div className="public-page-hero__copy">
          <p className="public-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          {actions ? <div className="public-actions">{actions}</div> : null}
        </div>
        {image ? (
          <figure className="public-editorial-photo public-page-hero__photo">
            <Image
              alt={image.alt}
              height={1024}
              sizes="(max-width: 960px) 100vw, 42vw"
              src={image.src}
              width={1536}
            />
          </figure>
        ) : null}
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

export function PublicPrice({ value }: { value: number }) {
  return (
    <p className="public-price-card__price">
      <span>FCFA</span>
      <strong>{new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value)}</strong>
    </p>
  )
}

export function FAQList({
  groupId,
  items,
}: {
  groupId?: string
  items: Array<{ answer: string; question: string }>
}) {
  return <FAQAccordion groupId={groupId} items={items} />
}
