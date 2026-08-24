import type { AlertListParams, ApiAlert, ApiAlertCreate, PaginatedAlerts } from '../../types/api/alert.ts'
import { apiRequest } from './client.ts'

function buildAlertsQuery(params: AlertListParams = {}): string {
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
  if (params.status !== undefined) {
    searchParams.set('status', params.status)
  }
  if (params.severity !== undefined) {
    searchParams.set('severity', params.severity)
  }
  if (params.service_id !== undefined) {
    searchParams.set('service_id', String(params.service_id))
  }
  if (params.incident_id !== undefined) {
    searchParams.set('incident_id', String(params.incident_id))
  }

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function fetchAlerts(params: AlertListParams = {}): Promise<PaginatedAlerts> {
  return apiRequest<PaginatedAlerts>(`/alerts${buildAlertsQuery(params)}`)
}

export function createAlert(data: ApiAlertCreate): Promise<ApiAlert> {
  return apiRequest<ApiAlert>('/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function acknowledgeAlert(id: number): Promise<ApiAlert> {
  return apiRequest<ApiAlert>(`/alerts/${id}/acknowledge`, {
    method: 'POST',
  })
}

export function resolveAlert(id: number): Promise<ApiAlert> {
  return apiRequest<ApiAlert>(`/alerts/${id}/resolve`, {
    method: 'POST',
  })
}
