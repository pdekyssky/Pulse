/** Backend report types and status values. */
export type ApiReportType =
  | 'incident_summary'
  | 'service_availability'
  | 'performance'
  | 'alert_summary'
  | 'monthly_operations'

export type ApiReportStatus = 'completed' | 'generating' | 'scheduled' | 'failed'

export type ApiReportPeriodFilter = 'all' | 'last_7_days' | 'last_30_days' | 'last_90_days'

export interface ApiReportMetric {
  label: string
  value: string
}

export interface ApiReport {
  id: string
  name: string
  type: ApiReportType
  period_start: string
  period_end: string
  created_at: string
  status: ApiReportStatus
  generated_by_id: number
  description: string | null
  summary: string
  scope: string
  service_ids: number[] | null
  metrics: ApiReportMetric[]
  scheduled_for: string | null
}

export interface ApiReportStats {
  total: number
  incident_reports: number
  service_reports: number
  scheduled: number
}

export interface PaginatedReports {
  items: ApiReport[]
  page: number
  page_size: number
  total: number
  total_pages: number
  stats: ApiReportStats
}

export interface ReportListParams {
  page?: number
  page_size?: number
  search?: string
  type?: ApiReportType
  status?: ApiReportStatus
  period?: ApiReportPeriodFilter
}
