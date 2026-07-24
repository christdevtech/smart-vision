import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import {
  DEFAULT_PROVIDER_FEE_PERCENTAGE,
  DEFAULT_REFERRAL_REWARD_PERCENTAGE,
} from '@/utilities/paymentAccounting'

const validNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

export const getPublicSiteData = cache(async () => {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'settings' })

    return {
      address: settings.siteAddress || '',
      annualPrice: validNumber(settings.subscriptionCosts?.yearly, 3500),
      description:
        settings.siteDescription ||
        'Focused learning resources, practice tools, and study support for secondary students.',
      email: settings.siteEmail || 'support@smartvisioncm.com',
      monthlyPrice: validNumber(settings.subscriptionCosts?.monthly, 500),
      phone: settings.sitePhone || '',
      providerFeePercentage: validNumber(
        settings.paymentAccounting?.providerFeePercentage,
        DEFAULT_PROVIDER_FEE_PERCENTAGE,
      ),
      referralProgramEnabled: settings.paymentAccounting?.referralProgramEnabled !== false,
      referralRewardPercentage: validNumber(
        settings.paymentAccounting?.referralRewardPercentage,
        DEFAULT_REFERRAL_REWARD_PERCENTAGE,
      ),
      siteName: settings.siteName || 'SmartVision',
    }
  } catch {
    return {
      address: '',
      annualPrice: 3500,
      description:
        'Focused learning resources, practice tools, and study support for secondary students.',
      email: 'support@smartvisioncm.com',
      monthlyPrice: 500,
      phone: '',
      providerFeePercentage: DEFAULT_PROVIDER_FEE_PERCENTAGE,
      referralProgramEnabled: true,
      referralRewardPercentage: DEFAULT_REFERRAL_REWARD_PERCENTAGE,
      siteName: 'SmartVision',
    }
  }
})

export const formatPublicCurrency = (value: number) =>
  new Intl.NumberFormat('en', {
    currency: 'XAF',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
