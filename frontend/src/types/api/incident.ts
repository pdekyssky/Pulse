export type ApiIncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

export type ApiIncidentSeverity = 'critical' | 'high' | 'medium' | 'low'

export type ApiIncidentSortField =
  | 'started_at'
  | 'created_at'
  | 'updated_at'
  | 'severity'
  | 'status'

export type ApiSortOrder = 'asc' | 'desc'

export interface ApiIncident {
  id: number
  title: string
  description: string | null
  status: string
  severity: string
  service_id: number
  created_by_id: number
  assigned_to_id: number | null
  started_at: string
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedIncidents {
  items: ApiIncident[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface ApiIncidentEvent {
  id: number
  incident_id: number
  author_id: number
  event_type: string
  message: string
  created_at: string
}

export interface ApiIncidentComment {
  id: number
  incident_id: number
  author_id: number
  content: string
  created_at: string
  updated_at: string
}

export interface IncidentListParams {
  page?: number
  page_size?: number
  search?: string
  status?: ApiIncidentStatus
  severity?: ApiIncidentSeverity
  service_id?: number
  assigned_to_id?: number
  sort_by?: ApiIncidentSortField
  sort_order?: ApiSortOrder
}

/** POST /api/v1/incidents — backend sets status, creator, and assignee. */
export interface ApiIncidentCreate {
  title: string
  description: string | null
  severity: ApiIncidentSeverity
  service_id: number
}

/** PATCH /api/v1/incidents/{id} — maps to `IncidentUpdate`. */
export interface ApiIncidentUpdate {
  title?: string | null
  description?: string | null
  status?: ApiIncidentStatus | null
  severity?: ApiIncidentSeverity | null
  service_id?: number | null
  assigned_to_id?: number | null
  started_at?: string | null
  resolved_at?: string | null
}

/** POST /api/v1/incidents/{id}/events */
export interface ApiIncidentEventCreate {
  event_type: string
  message: string
}

/** POST /api/v1/incidents/{id}/comments — maps to `IncidentCommentCreateBody`. */
export interface ApiIncidentCommentCreate {
  content: string
}

/** PATCH /api/v1/incidents/{id}/comments/{comment_id} — maps to `IncidentCommentUpdate`. */
export interface ApiIncidentCommentUpdate {
  content: string
}
