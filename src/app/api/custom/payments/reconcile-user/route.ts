import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createFapshiService } from '@/utilities/fapshi'

/**
 * API endpoint for reconciling transactions for a specific user
 * This is a simplified endpoint that directly calls the main reconciliation endpoint
 * with user-specific parameters
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Parse request body
    const body = await request.json()
    const { userId, userIds, academicLevel, startDate, endDate, force } = body

    // Validate request
    if (!userId && !userIds && !academicLevel) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId, userIds, or academicLevel' },
        { status: 400 },
      )
    }

    // If userIds is provided, validate it's an array
    if (userIds && !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 })
    }

    // Check user permissions - only admins or the user themselves can reconcile
    const { user } = request as any
    const isAdmin = user?.role && ['admin', 'super-admin'].includes(user.role)

    if (!isAdmin) {
      // If not admin, can only reconcile own transactions
      if (userIds || academicLevel || (userId && userId !== user.id)) {
        return NextResponse.json(
          { error: 'Unauthorized: Only admins can reconcile transactions for other users' },
          { status: 403 },
        )
      }
    }

    // Build URL for the main reconciliation endpoint
    const url = new URL('/api/custom/payments/reconcile', request.url)

    // Add query parameters
    if (startDate) url.searchParams.set('startDate', startDate)
    if (endDate) url.searchParams.set('endDate', endDate)
    if (force) url.searchParams.set('force', 'true')

    // Forward the request to the main reconciliation endpoint
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userIds,
        academicLevel,
      }),
    })

    const result = await response.json()

    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error('User reconciliation error:', error)
    return NextResponse.json(
      { error: 'Reconciliation failed', details: (error as Error).message || String(error) },
      { status: 500 },
    )
  }
}

// Get reconciliation report for a specific user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const academicLevel = searchParams.get('academicLevel')
    const days = searchParams.get('days') || '7'

    // Validate request
    if (!userId && !academicLevel) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId or academicLevel' },
        { status: 400 },
      )
    }

    // Check user permissions - only admins or the user themselves can view reports
    const { user } = request as any
    const isAdmin = user?.role && ['admin', 'super-admin'].includes(user.role)

    if (!isAdmin && userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can view reconciliation reports for other users' },
        { status: 403 },
      )
    }

    // Build URL for the main reconciliation report endpoint
    const url = new URL('/api/custom/payments/reconcile', request.url)

    // Add query parameters
    if (userId) url.searchParams.set('userId', userId)
    if (academicLevel) url.searchParams.set('academicLevel', academicLevel)
    if (days) url.searchParams.set('days', days)

    // Forward the request to the main reconciliation endpoint
    const response = await fetch(url, {
      method: 'GET',
    })

    const result = await response.json()

    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error('Get user reconciliation report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
