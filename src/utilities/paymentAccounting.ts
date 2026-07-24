import type { Payload, PayloadRequest } from 'payload'

export const DEFAULT_PROVIDER_FEE_PERCENTAGE = 3
export const DEFAULT_REFERRAL_REWARD_PERCENTAGE = 30

export type PaymentAccountingSettings = {
  providerFeePercentage: number
  referralProgramEnabled: boolean
  referralRewardPercentage: number
}

export type PaymentAccountingBreakdown = {
  grossAmount: number
  platformRevenueAfterReward: number
  providerFeeAmount: number
  providerFeeRateBasisPoints: number
  referralRewardAmount: number
  referralRewardRateBasisPoints: number
  revenue: number
}

const normalizePercentage = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(100, Math.max(0, parsed))
}

export const percentageToBasisPoints = (percentage: number): number =>
  Math.round(normalizePercentage(percentage, 0) * 100)

export function calculatePaymentAccounting({
  amount,
  providerFeePercentage = DEFAULT_PROVIDER_FEE_PERCENTAGE,
  providerRevenue,
  referralRewardPercentage = DEFAULT_REFERRAL_REWARD_PERCENTAGE,
}: {
  amount: number
  providerFeePercentage?: number
  providerRevenue?: number | null
  referralRewardPercentage?: number
}): PaymentAccountingBreakdown {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('Payment amount must be a non-negative integer')
  }

  const configuredFeeBasisPoints = percentageToBasisPoints(providerFeePercentage)
  const referralRewardRateBasisPoints = percentageToBasisPoints(referralRewardPercentage)
  const hasProviderRevenue =
    typeof providerRevenue === 'number' &&
    Number.isFinite(providerRevenue) &&
    providerRevenue >= 0 &&
    providerRevenue <= amount

  const revenue = hasProviderRevenue
    ? Math.round(providerRevenue)
    : Math.round(amount * (1 - configuredFeeBasisPoints / 10_000))
  const providerFeeAmount = amount - revenue
  const providerFeeRateBasisPoints =
    amount > 0 ? Math.round((providerFeeAmount / amount) * 10_000) : configuredFeeBasisPoints
  const referralRewardAmount = Math.round(amount * (referralRewardRateBasisPoints / 10_000))

  return {
    grossAmount: amount,
    platformRevenueAfterReward: revenue - referralRewardAmount,
    providerFeeAmount,
    providerFeeRateBasisPoints,
    referralRewardAmount,
    referralRewardRateBasisPoints,
    revenue,
  }
}

export async function getPaymentAccountingSettings(
  payload: Payload,
  req?: PayloadRequest,
): Promise<PaymentAccountingSettings> {
  try {
    const settings = await payload.findGlobal({
      slug: 'settings',
      ...(req ? { req } : {}),
    })
    const accounting = settings?.paymentAccounting

    return {
      providerFeePercentage: normalizePercentage(
        accounting?.providerFeePercentage,
        DEFAULT_PROVIDER_FEE_PERCENTAGE,
      ),
      referralProgramEnabled: accounting?.referralProgramEnabled !== false,
      referralRewardPercentage: normalizePercentage(
        accounting?.referralRewardPercentage,
        DEFAULT_REFERRAL_REWARD_PERCENTAGE,
      ),
    }
  } catch (error) {
    payload.logger?.error({
      err: error instanceof Error ? error : new Error(String(error)),
      msg: 'Unable to load payment accounting settings; using safe defaults',
    })
    return {
      providerFeePercentage: DEFAULT_PROVIDER_FEE_PERCENTAGE,
      referralProgramEnabled: true,
      referralRewardPercentage: DEFAULT_REFERRAL_REWARD_PERCENTAGE,
    }
  }
}
