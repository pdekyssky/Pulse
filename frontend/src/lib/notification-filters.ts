import type { NotificationListParams } from '../types/api/notification.ts'

export type NotificationReadFilter = 'all' | 'unread' | 'read'

export interface NotificationFilters {
  readStatus: NotificationReadFilter
}

export const defaultNotificationFilters: NotificationFilters = {
  readStatus: 'all',
}

export function buildNotificationListParams(
  filters: NotificationFilters,
  page: number,
  pageSize: number,
): NotificationListParams {
  const params: NotificationListParams = {
    page,
    page_size: pageSize,
  }

  if (filters.readStatus === 'unread') {
    params.is_read = false
  } else if (filters.readStatus === 'read') {
    params.is_read = true
  }

  return params
}
