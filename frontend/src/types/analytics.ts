/**
 * TypeScript types for analytics filters, KPIs, and chart data.
 */

import type { IncidentPriority, IncidentStatus } from './incident.ts'
import type { ServiceStatus } from './service.ts'

export interface IncidentTrendDataPoint {
  date: string
  label: string
  total: number
  critical: number
  resolved: number
}

export interface AnalyticsIncidentCounts {
  total: number
  open: number
  resolved: number
  bySeverity: Record<IncidentPriority, number>
  byStatus: Record<IncidentStatus, number>
  byService: Array<{
    serviceId: number | null
    serviceName: string
    count: number
  }>
}

export interface AnalyticsServiceItem {
  serviceId: string
  serviceName: string
  status: ServiceStatus
  uptime: number | null
  incidentCount: number
}

export interface AnalyticsServiceCounts {
  total: number
  operational: number
  degraded: number
  down: number
  items: AnalyticsServiceItem[]
}

export interface AnalyticsOverview {
  dateRange: AnalyticsDateRange
  serviceId: string | null
  incidents: AnalyticsIncidentCounts
  services: AnalyticsServiceCounts
  averageResolutionSeconds: number | null
  resolvedSampleSize: number
  incidentTrend: IncidentTrendDataPoint[]
}

export type AnalyticsDateRange = '7d' | '14d' | '30d'

export interface AnalyticsFilters {
  dateRange: AnalyticsDateRange
  serviceId: string
}
