import type {
  AnalyticsFilters,
  AnalyticsOverview,
  IncidentTrendDataPoint,
} from '../../types/analytics.ts'
import type {
  AnalyticsOverviewParams,
  ApiAnalyticsOverviewResponse,
} from '../../types/api/analytics.ts'

/** Map backend analytics overview to the UI data shape. */
export function mapApiAnalyticsOverview(
  response: ApiAnalyticsOverviewResponse,
): AnalyticsOverview {
  return {
    dateRange: response.date_range,
    serviceId: response.service_id !== null ? String(response.service_id) : null,
    incidents: {
      total: response.incidents.total,
      open: response.incidents.open,
      resolved: response.incidents.resolved,
      bySeverity: response.incidents.by_severity,
      byStatus: response.incidents.by_status,
      byService: response.incidents.by_service.map((row) => ({
        serviceId: row.service_id,
        serviceName: row.service_name,
        count: row.count,
      })),
    },
    services: {
      total: response.services.total,
      operational: response.services.operational,
      degraded: response.services.degraded,
      down: response.services.down,
      items: response.services.items.map((item) => ({
        serviceId: String(item.service_id),
        serviceName: item.service_name,
        status: item.status,
        uptime: item.uptime,
        incidentCount: item.incident_count,
      })),
    },
    averageResolutionSeconds: response.average_resolution_seconds,
    resolvedSampleSize: response.resolved_sample_size,
    incidentTrend: response.incident_trend.map(
      (point): IncidentTrendDataPoint => ({
        date: point.date,
        label: point.label,
        total: point.total,
        critical: point.critical,
        resolved: point.resolved,
      }),
    ),
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
