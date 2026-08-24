/** Backend alert status values (`AlertStatus` enum). */
export type ApiAlertStatus = 'new' | 'acknowledged' | 'resolved'

/** Backend alert severity values (`IncidentSeverity` enum). */
export type ApiAlertSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface ApiAlert {
  id: number
  name: string
  description: string | null
  status: string
  severity: string
  service_id: number
  incident_id: number | null
  created_at: string
  updated_at: string
}

export interface PaginatedAlerts {
  items: ApiAlert[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface AlertListParams {
  page?: number
  page_size?: number
  search?: string
  status?: ApiAlertStatus
  severity?: ApiAlertSeverity
  service_id?: number
  incident_id?: number
}

/** POST /api/v1/alerts */
export interface ApiAlertCreate {
  name: string
  description?: string | null
  severity: ApiAlertSeverity
  service_id: number
}
