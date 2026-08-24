import type { PaginatedTimelineEvents, TimelineListParams } from '../../types/api/timeline.ts'
import { apiRequest } from './client.ts'

function buildTimelineQuery(params: TimelineListParams = {}): string {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page))
  }
  if (params.page_size !== undefined) {
    searchParams.set('page_size', String(params.page_size))
  }
  if (params.search !== undefined && params.search.length > 0) {
    searchParams.set('search', params.search)
  }
  if (params.type !== undefined) {
    searchParams.set('type', params.type)
  }
  if (params.service_id !== undefined) {
    searchParams.set('service_id', String(params.service_id))
  }
  if (params.incident_id !== undefined) {
    searchParams.set('incident_id', String(params.incident_id))
  }
  if (params.alert_id !== undefined) {
    searchParams.set('alert_id', String(params.alert_id))
  }
  if (params.period !== undefined) {
    searchParams.set('period', params.period)
  }

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function fetchTimeline(params: TimelineListParams = {}): Promise<PaginatedTimelineEvents> {
  return apiRequest<PaginatedTimelineEvents>(`/timeline${buildTimelineQuery(params)}`)
}
