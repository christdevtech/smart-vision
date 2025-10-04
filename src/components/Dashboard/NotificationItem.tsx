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
  low: 'border-l-gray-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-400'
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
        ${notification.isRead ? 'bg-gray-800' : 'bg-gray-750'}
        border border-gray-700 rounded-r-lg
        hover:bg-gray-700 transition-colors duration-200
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 300 }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className="flex-shrink-0 text-lg">
          {typeIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(notification.createdAt)}
              </span>
              <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className={`mt-1 text-sm ${notification.isRead ? 'text-gray-400' : 'text-gray-200'}`}>
            {notification.message}
          </p>

          {/* Action buttons */}
          <div className="mt-3 flex items-center gap-2">
            {notification.actionLink && (
              <button
                onClick={() => notification.actionLink && window.open(notification.actionLink, '_blank')}
                className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {notification.actionLabel || 'View Details'}
              </button>
            )}
            
            {!notification.isRead && (
              <button
                onClick={onMarkAsRead}
                className="text-xs text-gray-400 hover:text-white transition-colors"
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