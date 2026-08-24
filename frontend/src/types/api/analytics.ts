/** Backend analytics date range values. */
export type ApiAnalyticsDateRange = '7d' | '14d' | '30d'

export interface ApiAnalyticsKpis {
  overall_uptime: string
  average_response_time: string
  total_incidents: number
  mttr: string
  alert_volume: number
}

export interface ApiUptimeDataPoint {
  date: string
  label: string
  uptime: number
}

export interface ApiIncidentTrendDataPoint {
  date: string
  label: string
  total: number
  critical: number
  resolved: number
}

export interface ApiResponseTimeDataPoint {
  date: string
  label: string
  response_time: number
}

export interface ApiServicePerformanceRow {
  service_id: number
  service_name: string
  uptime: number
  response_time: number
  incident_count: number
}

export interface ApiAnalyticsOverviewResponse {
  date_range: ApiAnalyticsDateRange
  service_id: number | null
  kpis: ApiAnalyticsKpis
  uptime_series: ApiUptimeDataPoint[]
  incident_trend: ApiIncidentTrendDataPoint[]
  response_time_series: ApiResponseTimeDataPoint[]
  service_performance: ApiServicePerformanceRow[]
}

export interface AnalyticsOverviewParams {
  date_range?: ApiAnalyticsDateRange
  service_id?: number
}
