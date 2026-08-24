import type {
  ApiTimelineEvent,
  ApiTimelineStats,
  TimelineListParams,
} from '../../types/api/timeline.ts'
import type { TimelineFilters, TimelineStats } from '../timeline-stats.ts'
import type {
  TimelineEvent,
  TimelineEventSeverity,
  TimelineEventType,
} from '../../types/timeline.ts'

const TIMELINE_EVENT_TYPES = new Set<TimelineEventType>([
  'incident_created',
  'incident_updated',
  'incident_resolved',
  'alert_triggered',
  'alert_acknowledged',
  'service_degraded',
  'service_recovered',
  'deployment',
  'maintenance',
])

const TIMELINE_SEVERITIES = new Set<TimelineEventSeverity>([
  'critical',
  'high',
  'medium',
  'low',
  'info',
])

function mapApiTimelineEventType(type: string): TimelineEventType {
  if (TIMELINE_EVENT_TYPES.has(type as TimelineEventType)) {
    return type as TimelineEventType
  }
  return 'incident_updated'
}

function mapApiTimelineEventSeverity(
  severity: string | null,
): TimelineEventSeverity | undefined {
  if (severity === null) {
    return undefined
  }
  if (TIMELINE_SEVERITIES.has(severity as TimelineEventSeverity)) {
    return severity as TimelineEventSeverity
  }
  return undefined
}

/** Map backend timeline event to the existing UI TimelineEvent shape. */
export function mapApiTimelineEventToTimelineEvent(api: ApiTimelineEvent): TimelineEvent {
  return {
    id: api.id,
    timestamp: api.timestamp,
    type: mapApiTimelineEventType(api.type),
    title: api.title,
    description: api.description,
    serviceId: api.service_id !== null ? String(api.service_id) : undefined,
    incidentId: api.incident_id !== null ? String(api.incident_id) : undefined,
    alertId: api.alert_id !== null ? String(api.alert_id) : undefined,
    severity: mapApiTimelineEventSeverity(api.severity),
  }
}

/** Map backend timeline stats to UI stats cards. */
export function mapApiTimelineStatsToTimelineStats(api: ApiTimelineStats): TimelineStats {
  return {
    eventsToday: api.events_today,
    incidents: api.incidents,
    alerts: api.alerts,
    serviceEvents: api.service_events,
  }
}

/** Map UI filters to GET /timeline query parameters. */
export function buildTimelineListParams(
  filters: TimelineFilters,
  page: number,
  pageSize: number,
): TimelineListParams {
  const params: TimelineListParams = {
    page,
    page_size: pageSize,
  }

  const search = filters.search.trim()
  if (search.length > 0) {
    params.search = search
  }
  if (filters.type !== 'all') {
    params.type = filters.type
  }
  if (filters.serviceId !== 'all') {
    const service_id = Number.parseInt(filters.serviceId, 10)
    if (!Number.isNaN(service_id)) {
      params.service_id = service_id
    }
  }
  if (filters.period !== 'all') {
    params.period = filters.period
  }

  return params
}
