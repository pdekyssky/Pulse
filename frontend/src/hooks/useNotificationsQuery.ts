import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/api/notifications.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import { mapApiNotificationToNotification } from '../lib/mappers/notification.ts'
import type { NotificationListParams } from '../types/api/notification.ts'
import type { Notification } from '../types/notification.ts'

export interface PaginatedNotificationList {
  items: Notification[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export function useNotificationsList(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.notifications, params],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PaginatedNotificationList> => {
      const response = await fetchNotifications(params)

      return {
        items: response.items.map(mapApiNotificationToNotification),
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
      }
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<Notification> => {
      const notification = await markNotificationRead(id)
      return mapApiNotificationToNotification(notification)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}
