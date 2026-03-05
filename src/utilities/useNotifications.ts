'use client'

import { useState, useEffect, useCallback } from 'react'
import { Notification } from '../payload-types'

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'system'
  | 'payment'
  | 'content'
  | 'achievement'
  | 'subscription'
  | 'referral'
  | 'study_plan'
  | 'test_result'
  | 'reminder'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  filter: NotificationFilter
  searchQuery: string
  setFilter: (filter: NotificationFilter) => void
  setSearchQuery: (query: string) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  filteredNotifications: Notification[]
}

export function useNotifications(userId?: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch notifications from API — filtered to current user via Payload REST query params
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        sort: '-createdAt',
        limit: '50',
        'where[isActive][equals]': 'true',
      })

      if (userId) {
        params.set('where[recipient][equals]', userId)
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      const data = await response.json()
      setNotifications(data.docs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Mark a single notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true, readAt: new Date().toISOString() }),
      })

      if (!response.ok) throw new Error('Failed to mark notification as read')

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
        ),
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark as read')
    }
  }, [])

  // Mark all unread notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      const response = await fetch('/api/custom/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds }),
      })

      if (!response.ok) throw new Error('Failed to mark all notifications as read')

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark all as read')
    }
  }, [notifications])

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to delete notification')

      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Error deleting notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }, [])

  // Refresh
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Filter + search
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread' && notification.isRead) return false
    if (filter !== 'all' && filter !== 'unread' && notification.type !== filter) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(q) ||
        notification.message.toLowerCase().includes(q)
      )
    }
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Initial load + 30s polling
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    filter,
    searchQuery,
    setFilter,
    setSearchQuery,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    filteredNotifications,
  }
}
