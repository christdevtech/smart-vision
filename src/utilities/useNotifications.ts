'use client'

import { useState, useEffect, useCallback } from 'react'
import { Notification } from '../payload-types'

export type NotificationFilter = 'all' | 'unread' | 'system' | 'payment' | 'content' | 'achievement'

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

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/notifications', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
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
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRead: true,
          readAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark as read')
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n.id)

      if (unreadIds.length === 0) return

      const response = await fetch('/api/custom/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: unreadIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark all as read')
    }
  }, [notifications])

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    } catch (err) {
      console.error('Error deleting notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }, [])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Filter and search notifications
  const filteredNotifications = notifications.filter(notification => {
    // Apply filter
    if (filter === 'unread' && notification.isRead) return false
    if (filter !== 'all' && filter !== 'unread' && notification.type !== filter) return false

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Initial fetch and setup polling for real-time updates
  useEffect(() => {
    fetchNotifications()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Set up WebSocket connection for real-time notifications (if available)
  useEffect(() => {
    // This would be implemented if WebSocket support is added
    // For now, we rely on polling
  }, [])

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