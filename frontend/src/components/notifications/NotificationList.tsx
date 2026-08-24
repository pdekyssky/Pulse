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
  mutatingNotificationId?: string | null
}

export default function NotificationList({
  notifications,
  totalCount,
  readFilter,
  onMarkAsRead,
  mutatingNotificationId = null,
}: NotificationListProps) {
  const hasNoNotifications = totalCount === 0
  const hasNoMatches = !hasNoNotifications && notifications.length === 0

  if (notifications.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="text-sm text-gray-500">
          {hasNoNotifications
            ? 'No notifications yet.'
            : hasNoMatches
              ? readFilter === 'unread'
                ? 'No unread notifications.'
                : readFilter === 'read'
                  ? 'No read notifications.'
                  : 'No notifications match your filters.'
              : 'No notifications on this page.'}
        </p>
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
          isMutating={mutatingNotificationId === notification.id}
        />
      ))}
    </div>
  )
}
