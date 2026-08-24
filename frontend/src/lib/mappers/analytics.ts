import type { AnalyticsFilters } from '../../types/analytics.ts'
import type {
  AnalyticsKpis,
  IncidentTrendDataPoint,
  ResponseTimeDataPoint,
  ServicePerformanceRow,
  UptimeDataPoint,
} from '../../types/analytics.ts'
import type {
  AnalyticsOverviewParams,
  ApiAnalyticsOverviewResponse,
} from '../../types/api/analytics.ts'

export interface AnalyticsOverviewData {
  dateRange: AnalyticsFilters['dateRange']
  serviceId: string | null
  kpis: AnalyticsKpis
  uptimeSeries: UptimeDataPoint[]
  incidentTrend: IncidentTrendDataPoint[]
  responseTimeSeries: ResponseTimeDataPoint[]
  servicePerformance: ServicePerformanceRow[]
}

/** Map backend analytics overview to the existing UI data shape. */
export function mapApiAnalyticsOverview(response: ApiAnalyticsOverviewResponse): AnalyticsOverviewData {
  return {
    dateRange: response.date_range,
    serviceId: response.service_id !== null ? String(response.service_id) : null,
    kpis: {
      overallUptime: response.kpis.overall_uptime,
      averageResponseTime: response.kpis.average_response_time,
      totalIncidents: response.kpis.total_incidents,
      mttr: response.kpis.mttr,
      alertVolume: response.kpis.alert_volume,
    },
    uptimeSeries: response.uptime_series,
    incidentTrend: response.incident_trend,
    responseTimeSeries: response.response_time_series.map((point) => ({
      date: point.date,
      label: point.label,
      responseTime: point.response_time,
    })),
    servicePerformance: response.service_performance.map((row) => ({
      serviceId: String(row.service_id),
      serviceName: row.service_name,
      uptime: row.uptime,
      responseTime: row.response_time,
      incidentCount: row.incident_count,
    })),
  }
}

/** Map UI filters to GET /analytics/overview query parameters. */
export function buildAnalyticsOverviewParams(filters: AnalyticsFilters): AnalyticsOverviewParams {
  const params: AnalyticsOverviewParams = {
    date_range: filters.dateRange,
  }

  if (filters.serviceId !== 'all') {
    const service_id = Number.parseInt(filters.serviceId, 10)
    if (!Number.isNaN(service_id)) {
      params.service_id = service_id
    }
  }

  return params
}
