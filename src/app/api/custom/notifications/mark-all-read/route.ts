import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

interface MarkAllReadRequest {
  ids: string[]
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

    // Parse request body
    const body: MarkAllReadRequest = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. ids array is required and must not be empty.' },
        { status: 400 }
      )
    }

    // Validate that all IDs are strings
    if (!ids.every(id => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'Invalid request. All notification IDs must be strings.' },
        { status: 400 }
      )
    }

    // Get notifications to verify they belong to the current user
    const notificationsResult = await payload.find({
      collection: 'notifications',
      where: {
        and: [
          {
            id: {
              in: ids,
            },
          },
          {
            user: {
              equals: user.id,
            },
          },
        ],
      },
    })

    if (notificationsResult.docs.length === 0) {
      return NextResponse.json(
        { error: 'No notifications found for the current user with the provided IDs.' },
        { status: 404 }
      )
    }

    // Update notifications to mark them as read
    const updatePromises = notificationsResult.docs.map(notification =>
      payload.update({
        collection: 'notifications',
        id: notification.id,
        data: {
          isRead: true,
          readAt: new Date().toISOString(),
        },
      })
    )

    const updatedNotifications = await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${updatedNotifications.length} notifications as read`,
      updatedCount: updatedNotifications.length,
      updatedNotifications: updatedNotifications.map(n => ({
        id: n.id,
        isRead: n.isRead,
        readAt: n.readAt,
      })),
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      {
        error: 'Internal server error occurred while marking notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for testing purposes
export async function GET() {
  return NextResponse.json({
    message: 'Mark all notifications as read endpoint',
    method: 'POST',
    expectedBody: {
      ids: ['notification_id_1', 'notification_id_2'],
    },
  })
}