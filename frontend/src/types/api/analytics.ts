/** Backend analytics date range values. */
export type ApiAnalyticsDateRange = '7d' | '14d' | '30d'

export interface ApiIncidentCountMap {
  critical?: number
  high?: number
  medium?: number
  low?: number
  investigating?: number
  identified?: number
  monitoring?: number
  resolved?: number
}

export interface ApiIncidentsByService {
  service_id: number | null
  service_name: string
  count: number
}

export interface ApiAnalyticsIncidents {
  total: number
  open: number
  resolved: number
  by_severity: Required<Pick<ApiIncidentCountMap, 'critical' | 'high' | 'medium' | 'low'>>
  by_status: Required<
    Pick<ApiIncidentCountMap, 'investigating' | 'identified' | 'monitoring' | 'resolved'>
  >
  by_service: ApiIncidentsByService[]
}

export interface ApiAnalyticsServiceItem {
  service_id: number
  service_name: string
  status: 'operational' | 'degraded' | 'down'
  uptime: number | null
  incident_count: number
}

export interface ApiAnalyticsServices {
  total: number
  operational: number
  degraded: number
  down: number
  items: ApiAnalyticsServiceItem[]
}

export interface ApiIncidentTrendDataPoint {
  date: string
  label: string
  total: number
  critical: number
  resolved: number
}

export interface ApiAnalyticsOverviewResponse {
  date_range: ApiAnalyticsDateRange
  service_id: number | null
  incidents: ApiAnalyticsIncidents
  services: ApiAnalyticsServices
  average_resolution_seconds: number | null
  resolved_sample_size: number
  incident_trend: ApiIncidentTrendDataPoint[]
}

export interface AnalyticsOverviewParams {
  date_range?: ApiAnalyticsDateRange
  service_id?: number
}
