import { Clock3, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PublicPageHero } from '@/components/PublicSite/PageElements'
import { getPublicSiteData } from '@/services/publicSite'

export const metadata: Metadata = {
  description: 'Contact SmartVision for account, subscription, payment, or learning support.',
  title: 'Contact',
}

export default async function ContactPage() {
  const site = await getPublicSiteData()

  return (
    <>
      <PublicPageHero
        description="Get help with your account, subscription, payment status, referral record, or use of the learning platform."
        eyebrow="Contact SmartVision"
        title="Tell us what you need help with."
      />

      <section className="public-section">
        <div className="public-shell public-contact-grid">
          <div className="public-contact-card">
            <p className="public-eyebrow">Contact details</p>
            <h2>Reach the SmartVision team.</h2>
            <div className="public-check-list">
              <p>
                <Mail aria-hidden="true" size={19} />{' '}
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>
              {site.phone ? (
                <p>
                  <Phone aria-hidden="true" size={19} />{' '}
                  <a href={`tel:${site.phone}`}>{site.phone}</a>
                </p>
              ) : null}
              {site.address ? (
                <p>
                  <MapPin aria-hidden="true" size={19} /> {site.address}
                </p>
              ) : null}
              <p>
                <Clock3 aria-hidden="true" size={19} /> Include enough detail for the team to
                investigate efficiently.
              </p>
            </div>
          </div>

          <div className="public-contact-card">
            <p className="public-eyebrow">Before you write</p>
            <h2>Help us resolve the issue faster.</h2>
            <ul className="public-check-list">
              <li>
                <ShieldCheck aria-hidden="true" size={19} />
                Never send your password, reset token, mobile-money PIN, or one-time approval code.
              </li>
              <li>
                <ShieldCheck aria-hidden="true" size={19} />
                For payment support, include the SmartVision transaction reference and approximate
                payment time—not your PIN.
              </li>
              <li>
                <ShieldCheck aria-hidden="true" size={19} />
                For content issues, include the subject, resource title, and what you expected to
                happen.
              </li>
              <li>
                <ShieldCheck aria-hidden="true" size={19} />
                For referrals, include the reward or transaction reference shown in your dashboard.
              </li>
            </ul>
            <div className="public-actions public-contact-actions">
              <a className="public-button public-button--support" href={`mailto:${site.email}`}>
                Email support
              </a>
              <Link className="public-button public-button--secondary" href="/faq">
                Check FAQs first
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
