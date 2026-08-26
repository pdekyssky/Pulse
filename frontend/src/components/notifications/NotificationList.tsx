/**
 * Vertical list of user notifications.
 */

import type { Notification } from '../../types/notification.ts'
import Card from '../ui/Card.tsx'
import NotificationRow from './NotificationRow.tsx'

interface NotificationListProps {
  notifications: Notification[]
  totalCount: number
  readFilter: 'all' | 'unread' | 'read'
  onMarkAsRead?: (notification: Notification) => void
  onOpen?: (notification: Notification) => void
  mutatingNotificationId?: string | null
}

export default function NotificationList({
  notifications,
  totalCount,
  readFilter,
  onMarkAsRead,
  onOpen,
  mutatingNotificationId = null,
}: NotificationListProps) {
  const hasNoNotifications = totalCount === 0

  if (notifications.length === 0) {
    const emptyMessage =
      readFilter === 'unread'
        ? "No unread notifications. You're all caught up."
        : readFilter === 'read'
          ? 'No read notifications yet.'
          : hasNoNotifications
            ? "No notifications yet. You'll be notified when an incident is assigned to you, its status changes, or someone comments or adds an event on an incident you're assigned to."
            : 'No notifications on this page.'

    return (
      <Card className="px-5 py-12 text-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onOpen={onOpen}
          isMutating={mutatingNotificationId === notification.id}
        />
      ))}
    </div>
  )
}
