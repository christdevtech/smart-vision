import { beforeEach, describe, expect, it, vi } from 'vitest'

const findGlobal = vi.fn()

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findGlobal }),
}))

describe('public site settings', () => {
  beforeEach(() => {
    findGlobal.mockReset()
  })

  it('uses live subscription and referral settings in public-facing data', async () => {
    findGlobal.mockResolvedValue({
      paymentAccounting: {
        providerFeePercentage: 2.5,
        referralProgramEnabled: true,
        referralRewardPercentage: 24,
      },
      siteDescription: 'Configured description',
      siteEmail: 'help@example.com',
      siteName: 'Configured SmartVision',
      subscriptionCosts: {
        monthly: 700,
        yearly: 7000,
      },
    })

    const { getPublicSiteData } = await import('@/services/publicSite')
    const site = await getPublicSiteData()

    expect(site).toMatchObject({
      annualPrice: 7000,
      description: 'Configured description',
      email: 'help@example.com',
      monthlyPrice: 700,
      providerFeePercentage: 2.5,
      referralProgramEnabled: true,
      referralRewardPercentage: 24,
      siteName: 'Configured SmartVision',
    })
    expect(findGlobal).toHaveBeenCalledWith({ slug: 'settings' })
  })
})
