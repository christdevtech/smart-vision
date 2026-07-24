import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Graphics/Logo/Logo'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { getPublicSiteData } from '@/services/publicSite'

const footerGroups = [
  {
    label: 'Platform',
    links: [
      ['Features', '/features'],
      ['Pricing', '/pricing'],
      ['Referral rewards', '/features#referrals'],
      ['FAQs', '/faq'],
    ],
  },
  {
    label: 'Company',
    links: [
      ['About', '/about'],
      ['Contact', '/contact'],
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
    ],
  },
] as const

export default async function Footer() {
  const site = await getPublicSiteData()

  return (
    <footer className="public-footer">
      <div className="public-shell public-footer__grid">
        <div className="public-footer__brand">
          <Logo />
          <p>{site.description}</p>
          <span>Secure MTN Mobile Money and Orange Money subscription payments.</span>
        </div>
        {footerGroups.map((group) => (
          <nav aria-label={`${group.label} links`} key={group.label}>
            <strong>{group.label}</strong>
            {group.links.map(([label, href]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
          </nav>
        ))}
        <div className="public-footer__contact">
          <strong>Referral program</strong>
          <p>
            Active subscribers can earn {site.referralRewardPercentage}% of a referred
            student&apos;s successful subscription payment.
          </p>
          <Link href="/dashboard/referrals">View referral dashboard</Link>
        </div>
      </div>
      <div className="public-shell public-footer__bottom">
        <p>
          © {new Date().getFullYear()} SmartVision Cameroon. All rights reserved.
          <a href="https://christdev.com" rel="noreferrer" target="_blank">
            Powered by ChristDev
          </a>
        </p>
        <ThemeSwitcher variant="icon-only" />
      </div>
    </footer>
  )
}
