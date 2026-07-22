import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { authorizePaymentOperator } from '@/utilities/paymentSecurity'

const operatorHeaders = (request: NextRequest): Headers => {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const authorization = request.headers.get('authorization')
  const cookie = request.headers.get('cookie')

  if (authorization) headers.set('authorization', authorization)
  if (cookie) headers.set('cookie', cookie)

  return headers
}

/**
 * API endpoint for reconciling transactions for a specific user
 * This is a simplified endpoint that directly calls the main reconciliation endpoint
 * with user-specific parameters
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const operator = await authorizePaymentOperator(payload, request.headers)

    if (!operator) {
      return NextResponse.json({ error: 'Admin or cron authorization required' }, { status: 401 })
    }

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

    if (Array.isArray(userIds) && userIds.length > 100) {
      return NextResponse.json(
        { error: 'A maximum of 100 users can be reconciled' },
        { status: 400 },
      )
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
      headers: operatorHeaders(request),
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
    const payload = await getPayload({ config })
    const operator = await authorizePaymentOperator(payload, request.headers)

    if (!operator) {
      return NextResponse.json({ error: 'Admin or cron authorization required' }, { status: 401 })
    }

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

    // Build URL for the main reconciliation report endpoint
    const url = new URL('/api/custom/payments/reconcile', request.url)

    // Add query parameters
    if (userId) url.searchParams.set('userId', userId)
    if (academicLevel) url.searchParams.set('academicLevel', academicLevel)
    if (days) url.searchParams.set('days', days)

    // Forward the request to the main reconciliation endpoint
    const response = await fetch(url, {
      method: 'GET',
      headers: operatorHeaders(request),
    })

    const result = await response.json()

    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error('Get user reconciliation report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
