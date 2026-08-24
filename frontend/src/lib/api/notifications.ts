import type {
  ApiMarkAllReadResponse,
  ApiNotification,
  NotificationListParams,
  PaginatedNotifications,
} from '../../types/api/notification.ts'
import { apiRequest } from './client.ts'

function buildNotificationsQuery(params: NotificationListParams = {}): string {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page))
  }
  if (params.page_size !== undefined) {
    searchParams.set('page_size', String(params.page_size))
  }
  if (params.is_read !== undefined) {
    searchParams.set('is_read', String(params.is_read))
  }

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function fetchNotifications(
  params: NotificationListParams = {},
): Promise<PaginatedNotifications> {
  return apiRequest<PaginatedNotifications>(`/notifications${buildNotificationsQuery(params)}`)
}

export function markNotificationRead(id: number): Promise<ApiNotification> {
  return apiRequest<ApiNotification>(`/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export function markAllNotificationsRead(): Promise<ApiMarkAllReadResponse> {
  return apiRequest<ApiMarkAllReadResponse>('/notifications/read-all', {
    method: 'PATCH',
  })
}
