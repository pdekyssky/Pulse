/**
 * In-app notifications page with API-backed list, filters, and read mutations.
 */

import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import QueryState from '../components/common/QueryState.tsx'
import NotificationFilters from '../components/notifications/NotificationFilters.tsx'
import NotificationList from '../components/notifications/NotificationList.tsx'
import NotificationPagination from '../components/notifications/NotificationPagination.tsx'
import NotificationsHeader from '../components/notifications/NotificationsHeader.tsx'
import Toast from '../components/ui/Toast.tsx'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from '../hooks/useNotificationsQuery.ts'
import { ApiError } from '../lib/api/client.ts'
import { getNotificationIncidentPath } from '../lib/mappers/notification.ts'
import {
  buildNotificationListParams,
  defaultNotificationFilters,
  type NotificationFilters as NotificationFiltersState,
} from '../lib/notification-filters.ts'
import type { Notification } from '../types/notification.ts'

function parseNotificationId(id: string): number {
  const notificationId = Number.parseInt(id, 10)
  if (Number.isNaN(notificationId)) {
    throw new Error('Invalid notification ID')
  }
  return notificationId
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<NotificationFiltersState>(defaultNotificationFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [mutatingNotificationId, setMutatingNotificationId] = useState<string | null>(null)

  const listParams = useMemo(
    () => buildNotificationListParams(filters, page, pageSize),
    [filters, page, pageSize],
  )

  const {
    data: notificationData,
    isLoading,
    error,
  } = useNotificationsList(listParams)

  const { data: unreadData } = useNotificationsList({
    is_read: false,
    page: 1,
    page_size: 1,
  })

  const markNotificationReadMutation = useMarkNotificationRead()
  const markAllNotificationsReadMutation = useMarkAllNotificationsRead()

  const notifications = notificationData?.items ?? []
  const unreadCount = unreadData?.total ?? 0

  const handleFiltersChange = (nextFilters: NotificationFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const dismissToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  const handleMarkAsRead = useCallback(
    async (notification: Notification) => {
      setActionError(null)
      setMutatingNotificationId(notification.id)

      try {
        await markNotificationReadMutation.mutateAsync(parseNotificationId(notification.id))
        setToastMessage('Notification marked as read.')
      } catch (mutationError) {
        const message =
          mutationError instanceof ApiError
            ? mutationError.message
            : mutationError instanceof Error
              ? mutationError.message
              : 'Request failed'

        setActionError(message)
      } finally {
        setMutatingNotificationId(null)
      }
    },
    [markNotificationReadMutation],
  )

  const handleOpen = useCallback(
    async (notification: Notification) => {
      setActionError(null)

      if (!notification.isRead) {
        setMutatingNotificationId(notification.id)

        try {
          await markNotificationReadMutation.mutateAsync(parseNotificationId(notification.id))
        } catch (mutationError) {
          const message =
            mutationError instanceof ApiError
              ? mutationError.message
              : mutationError instanceof Error
                ? mutationError.message
                : 'Request failed'

          setActionError(message)
          return
        } finally {
          setMutatingNotificationId(null)
        }
      }

      const incidentPath = getNotificationIncidentPath(notification)
      if (incidentPath) {
        navigate(incidentPath)
      }
    },
    [markNotificationReadMutation, navigate],
  )

  const handleMarkAllAsRead = useCallback(async () => {
    setActionError(null)

    try {
      const result = await markAllNotificationsReadMutation.mutateAsync()
      const count = result.updated_count
      setToastMessage(
        count === 1
          ? '1 notification marked as read.'
          : `${count} notifications marked as read.`,
      )
    } catch (mutationError) {
      const message =
        mutationError instanceof ApiError
          ? mutationError.message
          : mutationError instanceof Error
            ? mutationError.message
            : 'Request failed'

      setActionError(message)
    }
  }, [markAllNotificationsReadMutation])

  return (
    <QueryState
      isLoading={isLoading && notificationData === undefined}
      error={error}
      loadingMessage="Loading notifications..."
      errorTitle="Unable to load notifications"
    >
      <div className="space-y-6">
        <NotificationsHeader
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllAsRead}
          isMarkAllPending={markAllNotificationsReadMutation.isPending}
        />

        {actionError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </p>
        )}

        <NotificationFilters filters={filters} onChange={handleFiltersChange} />
        <NotificationList
          notifications={notifications}
          totalCount={notificationData?.total ?? 0}
          readFilter={filters.readStatus}
          onMarkAsRead={handleMarkAsRead}
          onOpen={handleOpen}
          mutatingNotificationId={mutatingNotificationId}
        />
        <NotificationPagination
          page={notificationData?.page ?? page}
          totalPages={notificationData?.total_pages ?? 0}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setPage((current) =>
              notificationData?.total_pages
                ? Math.min(notificationData.total_pages, current + 1)
                : current,
            )
          }
        />

        <Toast message={toastMessage} onClose={dismissToast} />
      </div>
    </QueryState>
  )
}
