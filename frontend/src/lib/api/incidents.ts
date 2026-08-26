import type {
  ApiIncident,
  ApiIncidentComment,
  ApiIncidentCommentCreate,
  ApiIncidentCommentUpdate,
  ApiIncidentCreate,
  ApiIncidentEvent,
  ApiIncidentEventCreate,
  ApiIncidentUpdate,
  IncidentListParams,
  PaginatedIncidents,
} from '../../types/api/incident.ts'
import { apiRequest } from './client.ts'

function buildIncidentsQuery(params: IncidentListParams = {}): string {
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
  if (params.assigned_to_id !== undefined) {
    searchParams.set('assigned_to_id', String(params.assigned_to_id))
  }
  if (params.sort_by !== undefined) {
    searchParams.set('sort_by', params.sort_by)
  }
  if (params.sort_order !== undefined) {
    searchParams.set('sort_order', params.sort_order)
  }

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function fetchIncidents(params: IncidentListParams = {}): Promise<PaginatedIncidents> {
  return apiRequest<PaginatedIncidents>(`/incidents${buildIncidentsQuery(params)}`)
}

export function fetchIncident(id: number): Promise<ApiIncident> {
  return apiRequest<ApiIncident>(`/incidents/${id}`)
}

export function fetchIncidentEvents(id: number): Promise<ApiIncidentEvent[]> {
  return apiRequest<ApiIncidentEvent[]>(`/incidents/${id}/events`)
}

export function fetchIncidentComments(id: number): Promise<ApiIncidentComment[]> {
  return apiRequest<ApiIncidentComment[]>(`/incidents/${id}/comments`)
}

export function createIncident(data: ApiIncidentCreate): Promise<ApiIncident> {
  return apiRequest<ApiIncident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateIncident(id: number, data: ApiIncidentUpdate): Promise<ApiIncident> {
  return apiRequest<ApiIncident>(`/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteIncident(id: number): Promise<void> {
  return apiRequest<void>(`/incidents/${id}`, {
    method: 'DELETE',
  })
}

export function createIncidentEvent(
  incidentId: number,
  data: ApiIncidentEventCreate,
): Promise<ApiIncidentEvent> {
  return apiRequest<ApiIncidentEvent>(`/incidents/${incidentId}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function createIncidentComment(
  incidentId: number,
  data: ApiIncidentCommentCreate,
): Promise<ApiIncidentComment> {
  return apiRequest<ApiIncidentComment>(`/incidents/${incidentId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateIncidentComment(
  incidentId: number,
  commentId: number,
  data: ApiIncidentCommentUpdate,
): Promise<ApiIncidentComment> {
  return apiRequest<ApiIncidentComment>(`/incidents/${incidentId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteIncidentComment(incidentId: number, commentId: number): Promise<void> {
  return apiRequest<void>(`/incidents/${incidentId}/comments/${commentId}`, {
    method: 'DELETE',
  })
}
