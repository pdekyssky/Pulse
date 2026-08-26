/**
 * TypeScript types for in-app user notifications.
 */

export type NotificationType =
  | 'incident_assigned'
  | 'incident_status_changed'
  | 'incident_comment'
  | 'incident_event'
  | 'alert_linked'
  | (string & {})

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  incidentId?: string
  alertId?: string
  createdAt: string
}

export const notificationTypeLabels: Record<string, string> = {
  incident_assigned: 'Incident Assigned',
  incident_status_changed: 'Status Changed',
  incident_comment: 'New Comment',
  incident_event: 'Investigation Event',
  alert_linked: 'Alert Linked',
}

export function getNotificationTypeLabel(type: string): string {
  return notificationTypeLabels[type] ?? type.replace(/_/g, ' ')
}
