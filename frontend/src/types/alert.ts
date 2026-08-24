/**
 * TypeScript types for monitoring alerts and severity levels.
 */

import type { ApiAlertSeverity } from './api/alert.ts'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export type AlertStatus = 'active' | 'acknowledged' | 'resolved'

export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  status: AlertStatus
  serviceId: string
  /** Linked incident when present on the backend; not shown in UI this phase. */
  incidentId?: string | null
  createdAt: string
  updatedAt?: string
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

/** Backend severity values used when creating alerts via the API. */
export const apiAlertSeverityLabels: Record<ApiAlertSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** Form input for creating an alert (backend field names). */
export interface AlertCreateFormInput {
  name: string
  description: string
  severity: ApiAlertSeverity
  serviceId: string
}
