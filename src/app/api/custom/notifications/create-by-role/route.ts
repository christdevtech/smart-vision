import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Notification } from '@/payload-types'

// Define valid user roles
const VALID_ROLES = ['super-admin', 'admin', 'content-manager', 'support', 'user']

// Define role hierarchy for access control
const ROLE_HIERARCHY = {
  'super-admin': 5,
  admin: 4,
  'content-manager': 3,
  support: 2,
  user: 1,
}

interface CreateNotificationRequest {
  title: string
  message: string
  targetRoles: string[]
  type?: Notification['type']
  priority?: Notification['priority']
  actionLink?: string
  actionLabel?: string
  scheduledFor?: string
  expiresAt?: string
  pushNotification?: Notification['pushNotification']
  metadata?: Notification['metadata']
}
export async function POST(request: NextRequest) {
  try {
    // Get payload instance
    const payload = await getPayload({ config })

    // Get user from authentication
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has permission to create notifications
    // Only admins, super-admins, and content-managers can create notifications
    const allowedRoles = ['super-admin', 'admin', 'content-manager']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error:
            'Insufficient permissions. Only admins and content managers can create notifications.',
        },
        { status: 403 },
      )
    }

    // Parse request body
    const body: CreateNotificationRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.message || !body.targetRoles || !Array.isArray(body.targetRoles)) {
      return NextResponse.json(
        {
          error: 'Missing required fields: title, message, and targetRoles (array)',
        },
        { status: 400 },
      )
    }

    // Validate target roles
    const invalidRoles = body.targetRoles.filter((role) => !VALID_ROLES.includes(role))
    if (invalidRoles.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${VALID_ROLES.join(', ')}`,
        },
        { status: 400 },
      )
    }

    // Check role hierarchy - users can only send notifications to roles at their level or below
    const userRoleLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0
    const targetRoleLevels = body.targetRoles.map(
      (role) => ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0,
    )
    const unauthorizedTargets = body.targetRoles.filter(
      (role, index) => targetRoleLevels[index] > userRoleLevel,
    )

    if (unauthorizedTargets.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot send notifications to higher-level roles: ${unauthorizedTargets.join(', ')}`,
        },
        { status: 403 },
      )
    }

    // Find all users with the target roles
    const targetUsers = await payload.find({
      collection: 'users',
      where: {
        role: {
          in: body.targetRoles,
        },
        isActive: {
          equals: true,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      limit: 1000, // Adjust based on your needs
    })

    if (targetUsers.docs.length === 0) {
      return NextResponse.json(
        {
          error: 'No active users found with the specified roles',
        },
        { status: 404 },
      )
    }

    // Prepare notification data
    const notificationData = {
      title: body.title,
      message: body.message,
      type: (body.type as Notification['type']) || 'general',
      priority: (body.priority as Notification['priority']) || 'normal',
      actionLink: body.actionLink,
      actionLabel: body.actionLabel,
      scheduledFor: body.scheduledFor,
      expiresAt: body.expiresAt,
      pushNotification: {
        sendPush: body.pushNotification?.sendPush ?? true,
        sound: body.pushNotification?.sound,
        badge: body.pushNotification?.badge,
        data: body.pushNotification?.data,
      },
      metadata: {
        relatedContentType: body.metadata?.relatedContentType,
        relatedContentId: body.metadata?.relatedContentId,
        source: body.metadata?.source || 'admin',
        tags: body.metadata?.tags || [],
      },
      isActive: true,
    }

    // Create notifications for each target user
    const createdNotifications = []
    const errors = []

    for (const targetUser of targetUsers.docs) {
      try {
        const notification = await payload.create({
          collection: 'notifications',
          data: {
            ...notificationData,
            recipient: targetUser.id,
          },
        })
        createdNotifications.push({
          notificationId: notification.id,
          userId: targetUser.id,
          userEmail: targetUser.email,
          userName: `${targetUser.firstName} ${targetUser.lastName}`,
          userRole: targetUser.role,
        })
      } catch (error) {
        console.error(`Error creating notification for user ${targetUser.id}:`, error)
        errors.push({
          userId: targetUser.id,
          userEmail: targetUser.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: `Created ${createdNotifications.length} notifications for users with roles: ${body.targetRoles.join(', ')}`,
      summary: {
        totalTargetUsers: targetUsers.docs.length,
        successfulNotifications: createdNotifications.length,
        failedNotifications: errors.length,
        targetRoles: body.targetRoles,
      },
      createdNotifications,
      ...(errors.length > 0 && { errors }),
    }

    // Return appropriate status code
    const statusCode = errors.length === 0 ? 201 : createdNotifications.length > 0 ? 207 : 500

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('Error creating role-based notifications:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// GET endpoint to retrieve information about available roles and permissions
export async function GET(request: NextRequest) {
  try {
    // Get payload instance
    const payload = await getPayload({ config })

    // Get user from authentication
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has permission to view notification creation info
    const allowedRoles = ['super-admin', 'admin', 'content-manager']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
        },
        { status: 403 },
      )
    }

    // Get user role level for determining accessible target roles
    const userRoleLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0
    const accessibleRoles = VALID_ROLES.filter(
      (role) => ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] <= userRoleLevel,
    )

    // Get count of users by role
    const roleCounts: Record<string, number> = {}
    for (const role of accessibleRoles) {
      const count = await payload.count({
        collection: 'users',
        where: {
          role: { equals: role },
          isActive: { equals: true },
        },
      })
      roleCounts[role] = count.totalDocs
    }

    return NextResponse.json({
      userRole: user.role,
      userRoleLevel,
      availableRoles: VALID_ROLES,
      accessibleTargetRoles: accessibleRoles,
      roleHierarchy: ROLE_HIERARCHY,
      activeUserCounts: roleCounts,
      notificationTypes: [
        'system',
        'payment',
        'subscription',
        'content',
        'achievement',
        'reminder',
        'referral',
        'study_plan',
        'test_result',
        'general',
      ],
      priorityLevels: ['low', 'normal', 'high', 'urgent'],
    })
  } catch (error) {
    console.error('Error fetching notification creation info:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}
