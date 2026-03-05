'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, Search, SlidersHorizontal } from 'lucide-react'
import { Notification } from '@/payload-types'
import { useNotifications, NotificationFilter } from '@/utilities/useNotifications'
import { NotificationItem } from '@/components/Dashboard/NotificationItem'

interface NotificationsPageClientProps {
  initialNotifications: Notification[]
  userId: string
}

const FILTER_TABS: { label: string; value: NotificationFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'System', value: 'system' },
  { label: 'Payment', value: 'payment' },
  { label: 'Subscription', value: 'subscription' },
  { label: 'Achievements', value: 'achievement' },
  { label: 'Test Results', value: 'test_result' },
  { label: 'Reminders', value: 'reminder' },
]

export default function NotificationsPageClient({
  initialNotifications,
  userId,
}: NotificationsPageClientProps) {
  const {
    filteredNotifications,
    unreadCount,
    loading,
    filter,
    searchQuery,
    setFilter,
    setSearchQuery,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId)

  // On initial render use server data, then switch to live hook data
  const notificationsToRender =
    filteredNotifications.length > 0 || loading === false
      ? filteredNotifications
      : initialNotifications

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-4 bg-card rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notifications…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              filter === tab.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.value === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-destructive text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p>Loading notifications…</p>
        </div>
      ) : notificationsToRender.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="w-10 h-10 opacity-40" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {filter === 'unread' ? "You're all caught up!" : 'No notifications yet'}
          </h3>
          <p className="text-sm text-center max-w-xs">
            {filter === 'unread'
              ? 'All notifications have been read.'
              : 'Notifications about your activity will appear here.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notificationsToRender.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
