/**
 * TypeScript types for monitoring alerts and severity levels.
 */

export type AlertSeverity = 'critical' | 'warning' | 'info'

export type AlertStatus = 'active' | 'acknowledged' | 'resolved'

export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  status: AlertStatus
  serviceId: string
  createdAt: string
}

export const alertSeverityLabels: Record<AlertSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

export const alertStatusLabels: Record<AlertStatus, string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
}
