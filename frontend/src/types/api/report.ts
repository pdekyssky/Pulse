import type { ApiIncidentSeverity, ApiIncidentStatus } from './incident.ts'

export interface ApiIncidentReportRow {
  id: number
  title: string
  severity: string
  status: string
  service_id: number | null
  service_name: string | null
  assigned_to_id: number | null
  assigned_to_name: string | null
  created_at: string
  resolved_at: string | null
}

export interface ApiIncidentReportStats {
  total: number
  open: number
  resolved: number
}

export interface PaginatedIncidentReports {
  items: ApiIncidentReportRow[]
  page: number
  page_size: number
  total: number
  total_pages: number
  stats: ApiIncidentReportStats
}

export interface IncidentReportListParams {
  page?: number
  page_size?: number
  search?: string
  severity?: ApiIncidentSeverity
  status?: ApiIncidentStatus
  service_id?: number
  period?: 'all' | 'last_7_days' | 'last_30_days' | 'last_90_days'
}
