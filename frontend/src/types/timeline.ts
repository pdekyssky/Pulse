/**
 * TypeScript types for cross-domain timeline events.
 */

export type TimelineEventType =
  | 'incident_created'
  | 'incident_updated'
  | 'incident_resolved'
  | 'alert_triggered'
  | 'alert_acknowledged'
  | 'service_degraded'
  | 'service_recovered'
  | 'deployment'
  | 'maintenance'

export type TimelineEventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface TimelineEvent {
  id: string
  timestamp: string
  type: TimelineEventType
  title: string
  description: string
  serviceId?: string
  incidentId?: string
  alertId?: string
  severity?: TimelineEventSeverity
}

export const timelineEventTypeLabels: Record<TimelineEventType, string> = {
  incident_created: 'Incident Created',
  incident_updated: 'Incident Updated',
  incident_resolved: 'Incident Resolved',
  alert_triggered: 'Alert Triggered',
  alert_acknowledged: 'Alert Acknowledged',
  service_degraded: 'Service Degraded',
  service_recovered: 'Service Recovered',
  deployment: 'Deployment',
  maintenance: 'Maintenance',
}

export const timelineEventCategories = {
  incident: ['incident_created', 'incident_updated', 'incident_resolved'] as const,
  alert: ['alert_triggered', 'alert_acknowledged'] as const,
  service: ['service_degraded', 'service_recovered', 'deployment', 'maintenance'] as const,
}
