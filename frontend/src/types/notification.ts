/**
 * TypeScript types for in-app user notifications.
 */

export type NotificationType = 'incident_assigned' | 'alert_linked' | (string & {})

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
  alert_linked: 'Alert Linked',
}

export function getNotificationTypeLabel(type: string): string {
  return notificationTypeLabels[type] ?? type.replace(/_/g, ' ')
}
