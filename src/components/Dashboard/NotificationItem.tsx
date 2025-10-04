'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Notification } from '@/payload-types'
import { Clock, X, ExternalLink } from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: () => void
  onDelete: () => void
}

const priorityColors = {
  low: 'border-l-muted-foreground',
  medium: 'border-l-warning',
  high: 'border-l-warning',
  urgent: 'border-l-destructive'
}

const typeIcons = {
  system: '⚙️',
  payment: '💳',
  content: '📚',
  achievement: '🏆',
  reminder: '⏰',
  update: '🔄'
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const priorityColor = priorityColors[notification.priority as keyof typeof priorityColors] || priorityColors.medium
  const typeIcon = typeIcons[notification.type as keyof typeof typeIcons] || '📢'

  return (
    <motion.div
      className={`
        relative p-4 border-l-4 ${priorityColor}
        ${notification.isRead ? 'bg-dashboard-card/50' : 'bg-dashboard-card'}
        border border-border rounded-r-lg
        hover:bg-accent/50 transition-colors duration-200
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 300 }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
      )}

      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className="flex-shrink-0 text-lg">
          {typeIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className={`text-sm font-medium ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(notification.createdAt)}
              </span>
              <button
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className={`mt-1 text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-foreground/80'}`}>
            {notification.message}
          </p>

          {/* Action buttons */}
          <div className="mt-3 flex items-center gap-2">
            {notification.actionLink && (
              <button
                onClick={() => {
                  if (notification.actionLink) {
                    window.open(notification.actionLink, '_blank')
                  }
                }}
                className="flex items-center gap-1 text-xs bg-primary hover:bg-primary/80 text-primary-foreground px-3 py-1 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {notification.actionLabel || 'View Details'}
              </button>
            )}
            
            {!notification.isRead && (
              <button
                onClick={onMarkAsRead}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}