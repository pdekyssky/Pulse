import type { ApiNotification } from '../../types/api/notification.ts'
import type { Notification } from '../../types/notification.ts'
import { parseIncidentNumericId } from '../incident-utils.ts'

export function mapApiNotificationToNotification(api: ApiNotification): Notification {
  return {
    id: String(api.id),
    type: api.type,
    title: api.title,
    message: api.message,
    isRead: api.is_read,
    incidentId: api.incident_id !== null ? `inc-${api.incident_id}` : undefined,
    alertId: api.alert_id !== null ? String(api.alert_id) : undefined,
    createdAt: api.created_at,
  }
}

export function getNotificationIncidentPath(notification: Notification): string | null {
  if (!notification.incidentId) {
    return null
  }

  const incidentId = parseIncidentNumericId(notification.incidentId)
  return incidentId ? `/incidents/${incidentId}` : null
}
