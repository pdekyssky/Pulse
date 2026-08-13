/**
 * TypeScript types for incidents, events, logs, and form inputs.
 */

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low'

export type IncidentEventType =
  | 'status_change'
  | 'comment'
  | 'assignment'
  | 'escalation'
  | 'resolution'

export type IncidentLogLevel = 'info' | 'warn' | 'error'

export interface IncidentEvent {
  id: string
  timestamp: string
  type: IncidentEventType
  message: string
  userId?: string
}

export interface IncidentLog {
  id: string
  timestamp: string
  level: IncidentLogLevel
  message: string
}

export interface IncidentComment {
  id: string
  timestamp: string
  userId: string
  content: string
}

export interface Incident {
  id: string
  title: string
  description: string
  status: IncidentStatus
  priority: IncidentPriority
  startedAt: string
  duration: string
  assigneeId: string
  affectedServiceIds: string[]
  timeline: IncidentEvent[]
  logs: IncidentLog[]
  comments: IncidentComment[]
}

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

export const incidentPriorityLabels: Record<IncidentPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export interface CreateIncidentInput {
  title: string
  description: string
  priority: IncidentPriority
  affectedServiceId: string
  assigneeId: string
}
