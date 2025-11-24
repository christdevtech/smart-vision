interface FapshiConfig {
  apiUser: string
  apiKey: string
  baseUrl: string
  webhookUrl?: string
}

interface FapshiPaymentRequest {
  amount: number
  phone: string
  medium?: 'mobile money' | 'orange money'
  name?: string
  email?: string
  userId?: string
  externalId?: string
  message?: string
}

interface FapshiTransaction {
  transId: string
  status: 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'
  medium: string
  serviceName: string
  amount: number
  revenue: number
  payerName: string
  email: string
  redirectUrl: string
  externalId: string
  userId: string
  webhook: string
  financialTransId: string
  dateInitiated: string
  dateConfirmed: string
}

interface FapshiSearchParams {
  status?: 'created' | 'successful' | 'failed' | 'expired'
  medium?: 'mobile money' | 'orange money'
  start?: string // YYYY-MM-DD
  end?: string // YYYY-MM-DD
  amt?: number
  limit?: number
  sort?: 'asc' | 'desc'
}

export class FapshiService {
  private config: FapshiConfig
  private maxRetries: number = 3
  private retryDelay: number = 1000 // 1 second

  constructor(config: FapshiConfig) {
    this.config = config
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    const headers = {
      apiuser: this.config.apiUser,
      apikey: this.config.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    let lastError: Error

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error
        console.error(`Fapshi API attempt ${attempt} failed:`, error)

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt) // Exponential backoff
        }
      }
    }

    throw lastError!
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Initiate a direct payment
   */
  async initiatePayment(paymentData: FapshiPaymentRequest): Promise<{
    message: string
    transId: string
    dateInitiated: string
  }> {
    return this.makeRequest('/direct-pay', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  /**
   * Get payment status by transaction ID
   */
  async getPaymentStatus(transId: string): Promise<FapshiTransaction> {
    return this.makeRequest(`/payment-status/${transId}`)
  }

  /**
   * Expire a payment transaction
   */
  async expirePayment(transId: string): Promise<FapshiTransaction> {
    return this.makeRequest('/expire-pay', {
      method: 'POST',
      body: JSON.stringify({ transId }),
    })
  }

  /**
   * Get transactions by user ID
   */
  async getTransactionsByUserId(userId: string): Promise<FapshiTransaction[]> {
    return this.makeRequest(`/transaction/${userId}`)
  }

  /**
   * Search transactions with filters
   */
  async searchTransactions(params: FapshiSearchParams): Promise<FapshiTransaction[]> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value.toString()
          }
          return acc
        },
        {} as Record<string, string>,
      ),
    ).toString()

    return this.makeRequest(`/search?${queryString}`)
  }

  /**
   * Get service balance
   */
  async getBalance(): Promise<{
    service: string
    balance: number
    currency: string
  }> {
    return this.makeRequest('/balance')
  }

  /**
   * Validate webhook payload (basic validation)
   */
  validateWebhookPayload(payload: any): payload is FapshiTransaction {
    return (
      payload &&
      typeof payload.transId === 'string' &&
      typeof payload.status === 'string' &&
      ['CREATED', 'PENDING', 'SUCCESSFUL', 'FAILED', 'EXPIRED'].includes(payload.status)
    )
  }

  /**
   * Map Fapshi status to internal status
   */
  mapFapshiStatus(fapshiStatus: string): string {
    const statusMap: Record<string, string> = {
      CREATED: 'created',
      PENDING: 'pending',
      SUCCESSFUL: 'successful',
      FAILED: 'failed',
      EXPIRED: 'expired',
    }
    return statusMap[fapshiStatus] || 'unknown'
  }
}

// Factory function to create Fapshi service instance
export function createFapshiService(): FapshiService {
  const isProduction = process.env.FAPSHI_ENV_MODE === 'production'

  const config: FapshiConfig = {
    apiUser: process.env.FAPSHI_API_USER!,
    apiKey: process.env.FAPSHI_API_KEY!,
    baseUrl: isProduction ? 'https://api.fapshi.com' : 'https://sandbox.fapshi.com',
    webhookUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}${process.env.FAPSHI_WEBHOOK_URL}`,
  }

  if (!config.apiUser || !config.apiKey) {
    throw new Error('Fapshi API credentials not configured')
  }

  return new FapshiService(config)
}

// Utility function to generate unique external ID
export function generateExternalId(prefix: string = 'sv'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `${prefix}_${timestamp}_${random}`
}

// Utility function to validate phone number format
export function validatePhoneNumber(phone: string): boolean {
  // Cameroon phone number validation (6XXXXXXXX or 67XXXXXXX format)
  const phoneRegex = /^6[0-9]{8}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// Utility function to format phone number
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^(\+237|237)/, '')
}
