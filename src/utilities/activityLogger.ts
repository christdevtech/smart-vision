import { getPayload } from 'payload'
import config from '@payload-config'

// Types for activity logging
export interface ActivityLogData {
  action: string
  category?: string
  user?: string | null
  userType?: 'user' | 'admin' | 'system' | 'anonymous'
  description?: string
  metadata?: Record<string, any>
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success?: boolean
  errorMessage?: string
  duration?: number
  source?: 'web' | 'mobile' | 'api' | 'admin' | 'system' | 'webhook'
  geolocation?: {
    country?: string
    city?: string
    latitude?: number
    longitude?: number
  }
}

// Request context interface for extracting common data
export interface RequestContext {
  req?: {
    ip?: string
    headers?: {
      'user-agent'?: string
      'x-forwarded-for'?: string
    }
    user?: {
      id: string
      role?: string
    }
    session?: {
      id?: string
    }
  }
}

/**
 * Main activity logger class
 */
export class ActivityLogger {
  private static instance: ActivityLogger
  private payload: any

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger()
    }
    return ActivityLogger.instance
  }

  private async getPayloadInstance() {
    if (!this.payload) {
      this.payload = await getPayload({ config })
    }
    return this.payload
  }

  /**
   * Extract common data from request context
   */
  private extractRequestData(context?: RequestContext): Partial<ActivityLogData> {
    if (!context?.req) return {}

    const { req } = context
    
    return {
      ipAddress: req.ip || req.headers?.['x-forwarded-for'] as string,
      userAgent: req.headers?.['user-agent'],
      user: req.user?.id || null,
      userType: req.user?.role === 'admin' ? 'admin' : req.user ? 'user' : 'anonymous',
      sessionId: req.session?.id,
    }
  }

  /**
   * Log an activity
   */
  async log(data: ActivityLogData, context?: RequestContext): Promise<void> {
    try {
      const payload = await this.getPayloadInstance()
      const requestData = this.extractRequestData(context)
      
      // Merge data with request context
      const logData = {
        timestamp: new Date(),
        success: true,
        source: 'web',
        ...requestData,
        ...data,
      }

      // Auto-set category based on action if not provided
      if (!logData.category && logData.action) {
        logData.category = logData.action.split('.')[0]
      }

      await payload.create({
        collection: 'activity-logs',
        data: logData,
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
      // Don't throw error to avoid breaking the main application flow
    }
  }

  /**
   * Log authentication activities
   */
  async logAuth(action: string, userId?: string, context?: RequestContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action: `auth.${action}`,
      category: 'auth',
      user: userId || null,
      metadata,
    }, context)
  }

  /**
   * Log content activities
   */
  async logContent(action: string, userId: string, resourceType: string, resourceId: string, context?: RequestContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action: `content.${action}`,
      category: 'content',
      user: userId,
      resourceType,
      resourceId,
      metadata,
    }, context)
  }

  /**
   * Log admin activities
   */
  async logAdmin(action: string, adminId: string, resourceType?: string, resourceId?: string, context?: RequestContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action: `admin.${action}`,
      category: 'admin',
      user: adminId,
      userType: 'admin',
      resourceType,
      resourceId,
      metadata,
    }, context)
  }

  /**
   * Log subscription activities
   */
  async logSubscription(action: string, userId: string, context?: RequestContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action: `subscription.${action}`,
      category: 'subscription',
      user: userId,
      resourceType: 'subscriptions',
      metadata,
    }, context)
  }

  /**
   * Log security events
   */
  async logSecurity(action: string, userId?: string, context?: RequestContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action: `security.${action}`,
      category: 'security',
      user: userId || null,
      metadata,
    }, context)
  }

  /**
   * Log system events
   */
  async logSystem(action: string, context?: RequestContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action: `system.${action}`,
      category: 'system',
      userType: 'system',
      metadata,
    }, context)
  }

  /**
   * Log errors with additional context
   */
  async logError(action: string, error: Error, userId?: string, context?: RequestContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      user: userId || null,
      success: false,
      errorMessage: error.message,
      metadata: {
        ...metadata,
        errorStack: error.stack,
        errorName: error.name,
      },
    }, context)
  }

  /**
   * Log performance metrics
   */
  async logPerformance(action: string, duration: number, userId?: string, context?: RequestContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      user: userId || null,
      duration,
      metadata,
    }, context)
  }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance()

// Convenience functions for common logging scenarios
export const logActivity = (data: ActivityLogData, context?: RequestContext) => 
  activityLogger.log(data, context)

export const logAuth = (action: string, userId?: string, context?: RequestContext, metadata?: Record<string, any>) => 
  activityLogger.logAuth(action, userId, context, metadata)

export const logContent = (action: string, userId: string, resourceType: string, resourceId: string, context?: RequestContext, metadata?: Record<string, any>) => 
  activityLogger.logContent(action, userId, resourceType, resourceId, context, metadata)

export const logAdmin = (action: string, adminId: string, resourceType?: string, resourceId?: string, context?: RequestContext, metadata?: Record<string, any>) => 
  activityLogger.logAdmin(action, adminId, resourceType, resourceId, context, metadata)

export const logSubscription = (action: string, userId: string, context?: RequestContext, metadata?: Record<string, any>) => 
  activityLogger.logSubscription(action, userId, context, metadata)

export const logSecurity = (action: string, userId?: string, context?: RequestContext, metadata?: Record<string, any>) => 
  activityLogger.logSecurity(action, userId, context, metadata)

export const logSystem = (action: string, context?: RequestContext, metadata?: Record<string, any>) => 
  activityLogger.logSystem(action, context, metadata)

export const logError = (action: string, error: Error, userId?: string, context?: RequestContext, metadata?: Record<string, any>) => 
  activityLogger.logError(action, error, userId, context, metadata)

export const logPerformance = (action: string, duration: number, userId?: string, context?: RequestContext, metadata?: Record<string, any>) => 
  activityLogger.logPerformance(action, duration, userId, context, metadata)

// Middleware helper for Express/Next.js
export const createActivityLoggerMiddleware = () => {
  return (req: any, res: any, next: any) => {
    // Add activity logger to request object for easy access
    req.activityLogger = {
      log: (data: ActivityLogData) => activityLogger.log(data, { req }),
      logAuth: (action: string, userId?: string, metadata?: Record<string, any>) => 
        activityLogger.logAuth(action, userId, { req }, metadata),
      logContent: (action: string, userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) => 
        activityLogger.logContent(action, userId, resourceType, resourceId, { req }, metadata),
      logAdmin: (action: string, adminId: string, resourceType?: string, resourceId?: string, metadata?: Record<string, any>) => 
        activityLogger.logAdmin(action, adminId, resourceType, resourceId, { req }, metadata),
      logSubscription: (action: string, userId: string, metadata?: Record<string, any>) => 
        activityLogger.logSubscription(action, userId, { req }, metadata),
      logSecurity: (action: string, userId?: string, metadata?: Record<string, any>) => 
        activityLogger.logSecurity(action, userId, { req }, metadata),
      logSystem: (action: string, metadata?: Record<string, any>) => 
        activityLogger.logSystem(action, { req }, metadata),
      logError: (action: string, error: Error, userId?: string, metadata?: Record<string, any>) => 
        activityLogger.logError(action, error, userId, { req }, metadata),
      logPerformance: (action: string, duration: number, userId?: string, metadata?: Record<string, any>) => 
        activityLogger.logPerformance(action, duration, userId, { req }, metadata),
    }
    next()
  }
}