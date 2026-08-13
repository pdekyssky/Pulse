/**
 * TypeScript types for analytics filters, KPIs, and chart data.
 */

export interface UptimeDataPoint {
  date: string
  label: string
  uptime: number
}

export interface IncidentTrendDataPoint {
  date: string
  label: string
  total: number
  critical: number
  resolved: number
}

export interface ResponseTimeDataPoint {
  date: string
  label: string
  responseTime: number
}

export interface ServicePerformanceRow {
  serviceId: string
  serviceName: string
  uptime: number
  responseTime: number
  incidentCount: number
}

export interface AnalyticsKpis {
  overallUptime: string
  averageResponseTime: string
  totalIncidents: number
  mttr: string
  alertVolume: number
}

export type AnalyticsDateRange = '7d' | '14d' | '30d'

export type AnalyticsMetric = 'all' | 'uptime' | 'incidents' | 'responseTime'

export interface AnalyticsFilters {
  dateRange: AnalyticsDateRange
  serviceId: string
  metric: AnalyticsMetric
}

export interface ServiceUptimeSeries {
  serviceId: string
  data: UptimeDataPoint[]
}
