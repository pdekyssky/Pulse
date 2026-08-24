/** Backend timeline event types. */
export type ApiTimelineEventType =
  | 'incident_created'
  | 'incident_updated'
  | 'incident_resolved'
  | 'alert_triggered'
  | 'alert_acknowledged'
  | 'service_degraded'
  | 'service_recovered'
  | 'deployment'
  | 'maintenance'

/** Backend timeline event severity values. */
export type ApiTimelineEventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

/** Backend timeline period filter values. */
export type ApiTimelinePeriod = 'all' | 'today' | '7d' | '30d'

export interface ApiTimelineEvent {
  id: string
  timestamp: string
  type: ApiTimelineEventType
  title: string
  description: string
  service_id: number | null
  incident_id: number | null
  alert_id: number | null
  severity: ApiTimelineEventSeverity | null
}

export interface ApiTimelineStats {
  events_today: number
  incidents: number
  alerts: number
  service_events: number
}

export interface PaginatedTimelineEvents {
  items: ApiTimelineEvent[]
  page: number
  page_size: number
  total: number
  total_pages: number
  stats: ApiTimelineStats
}

export interface TimelineListParams {
  page?: number
  page_size?: number
  search?: string
  type?: ApiTimelineEventType
  service_id?: number
  incident_id?: number
  alert_id?: number
  period?: ApiTimelinePeriod
}
