/**
 * Notifications page title header with mark-all-read action.
 */

import { CheckCheck } from 'lucide-react'

interface NotificationsHeaderProps {
  unreadCount?: number
  onMarkAllRead?: () => void
  isMarkAllPending?: boolean
}

export default function NotificationsHeader({
  unreadCount = 0,
  onMarkAllRead,
  isMarkAllPending = false,
}: NotificationsHeaderProps) {
  const showMarkAll = onMarkAllRead !== undefined && unreadCount > 0

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Notifications</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          View updates about incidents and alerts assigned to you.
        </p>
      </div>

      {showMarkAll && (
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={isMarkAllPending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck className="size-4 text-gray-500" aria-hidden="true" />
          {isMarkAllPending ? 'Marking all as read...' : 'Mark all as read'}
        </button>
      )}
    </div>
  )
}
