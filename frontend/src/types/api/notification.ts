export interface ApiNotification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  is_read: boolean
  incident_id: number | null
  alert_id: number | null
  created_at: string
}

export interface PaginatedNotifications {
  items: ApiNotification[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface NotificationListParams {
  page?: number
  page_size?: number
  is_read?: boolean
}

/** PATCH /api/v1/notifications/read-all */
export interface ApiMarkAllReadResponse {
  updated_count: number
}
