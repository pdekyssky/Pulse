/**
 * Single notification row with type, message, related resource links, and read action.
 */

import { createElement } from 'react'
import { AlertTriangle, Bell, Check, Link2, Loader2, MessageSquare, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatDateTime, formatIncidentId, formatRelativeTime } from '../../lib/format.ts'
import { getNotificationIncidentPath } from '../../lib/mappers/notification.ts'
import { cn } from '../../lib/utils.ts'
import type { Notification } from '../../types/notification.ts'
import { getNotificationTypeLabel } from '../../types/notification.ts'
import Card from '../ui/Card.tsx'

interface NotificationRowProps {
  notification: Notification
  onMarkAsRead?: (notification: Notification) => void
  onOpen?: (notification: Notification) => void
  isMutating?: boolean
}

const typeIcons: Record<string, LucideIcon> = {
  incident_assigned: AlertTriangle,
  incident_status_changed: RefreshCw,
  incident_comment: MessageSquare,
  incident_event: Bell,
  alert_linked: Link2,
}

const typeMarkerStyles: Record<string, string> = {
  incident_assigned: 'bg-purple-100 text-purple-600',
  incident_status_changed: 'bg-blue-100 text-blue-600',
  incident_comment: 'bg-emerald-100 text-emerald-600',
  incident_event: 'bg-amber-100 text-amber-600',
  alert_linked: 'bg-orange-100 text-orange-600',
}

export default function NotificationRow({
  notification,
  onMarkAsRead,
  onOpen,
  isMutating = false,
}: NotificationRowProps) {
  const icon = typeIcons[notification.type] ?? Bell
  const markerStyle =
    typeMarkerStyles[notification.type] ?? 'bg-gray-100 text-gray-600'
  const showMarkAsRead = onMarkAsRead !== undefined && !notification.isRead
  const incidentPath = getNotificationIncidentPath(notification)
  const isOpenable = onOpen !== undefined

  return (
    <div
      className={cn(isOpenable && 'cursor-pointer')}
      onClick={isOpenable ? () => onOpen(notification) : undefined}
    >
    <Card
      className={cn(
        'p-4 transition-colors',
        !notification.isRead && 'border-pulse-200 bg-pulse-50/40',
        isOpenable && 'hover:border-pulse-300',
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            markerStyle,
          )}
        >
          {createElement(icon, { className: 'size-4', 'aria-hidden': true })}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-pulse-600">
                {getNotificationTypeLabel(notification.type)}
              </span>
              {!notification.isRead && (
                <span className="rounded-full bg-pulse-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pulse-700">
                  Unread
                </span>
              )}
              <span className="text-xs text-gray-400">·</span>
              <span
                className="text-xs text-gray-500"
                title={formatDateTime(notification.createdAt)}
              >
                {formatRelativeTime(notification.createdAt)}
              </span>
            </div>

            {showMarkAsRead && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onMarkAsRead(notification)
                }}
                disabled={isMutating}
                aria-label={`Mark "${notification.title}" as read`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMutating ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-3.5" aria-hidden="true" />
                )}
                {isMutating ? 'Marking...' : 'Mark as read'}
              </button>
            )}
          </div>

          <h3 className="mt-1 font-semibold text-gray-900">{notification.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{notification.message}</p>

          {(incidentPath || notification.alertId) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {incidentPath && (
                <Link
                  to={incidentPath}
                  onClick={(event) => {
                    if (!onOpen) {
                      return
                    }

                    event.preventDefault()
                    event.stopPropagation()
                    onOpen(notification)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
                >
                  <Link2 className="size-3" aria-hidden="true" />
                  {formatIncidentId(notification.incidentId ?? '')}
                </Link>
              )}
              {notification.alertId && (
                <Link
                  to="/alerts"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
                >
                  <Link2 className="size-3" aria-hidden="true" />
                  Alert #{notification.alertId}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
    </div>
  )
}
