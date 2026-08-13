/**
 * Analytics KPIs and chart data derived from mock datasets.
 */

import {
  analyticsMttr,
  incidentTrendSeries,
  overallUptimeSeries,
  responseTimeSeries,
  serviceUptimeSeries,
} from '../data/analytics.ts'
import { mockAlerts } from '../data/alerts.ts'
import { mockIncidents } from '../data/incidents.ts'
import { mockServices } from '../data/services.ts'
import type {
  AnalyticsFilters,
  AnalyticsKpis,
  IncidentTrendDataPoint,
  ResponseTimeDataPoint,
  ServicePerformanceRow,
  UptimeDataPoint,
} from '../types/analytics.ts'
import type { Service } from '../types/service.ts'

export const defaultAnalyticsFilters: AnalyticsFilters = {
  dateRange: '7d',
  serviceId: 'all',
  metric: 'all',
}

const dateRangeDays: Record<AnalyticsFilters['dateRange'], number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
}

export function computeAnalyticsKpis(
  services: Service[] = mockServices,
  incidents = mockIncidents,
  alerts = mockAlerts,
): AnalyticsKpis {
  const overallUptime =
    services.reduce((sum, service) => sum + service.uptime, 0) / services.length

  const responseTimes = services
    .map((service) => service.responseTime)
    .filter((value) => value > 0)

  const averageResponseTime =
    responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length

  return {
    overallUptime: `${overallUptime.toFixed(2)}%`,
    averageResponseTime: `${Math.round(averageResponseTime)} ms`,
    totalIncidents: incidents.length,
    mttr: analyticsMttr,
    alertVolume: alerts.length,
  }
}

export function sliceByDateRange<T extends { date: string }>(
  data: T[],
  dateRange: AnalyticsFilters['dateRange'],
): T[] {
  const days = dateRangeDays[dateRange]
  // Series are pre-sorted; take the trailing N days for the selected range
  return data.slice(-days)
}

export function getUptimeChartData(filters: AnalyticsFilters): UptimeDataPoint[] {
  if (filters.serviceId === 'all') {
    return sliceByDateRange(overallUptimeSeries, filters.dateRange)
  }

  const serviceSeries = serviceUptimeSeries.find(
    (series) => series.serviceId === filters.serviceId,
  )

  if (!serviceSeries) {
    return sliceByDateRange(overallUptimeSeries, filters.dateRange)
  }

  return sliceByDateRange(serviceSeries.data, filters.dateRange)
}

export function getIncidentTrendData(
  filters: AnalyticsFilters,
): IncidentTrendDataPoint[] {
  return sliceByDateRange(incidentTrendSeries, filters.dateRange)
}

export function getResponseTimeData(
  filters: AnalyticsFilters,
): ResponseTimeDataPoint[] {
  return sliceByDateRange(responseTimeSeries, filters.dateRange)
}

export function getServicePerformanceRows(
  services: Service[] = mockServices,
  incidents = mockIncidents,
): ServicePerformanceRow[] {
  return services
    .map((service) => ({
      serviceId: service.id,
      serviceName: service.name,
      uptime: service.uptime,
      responseTime: service.responseTime,
      incidentCount: incidents.filter((incident) =>
        incident.affectedServiceIds.includes(service.id),
      ).length,
    }))
    .sort((a, b) => b.uptime - a.uptime)
}

export function shouldShowChart(
  metric: AnalyticsFilters['metric'],
  chart: Exclude<AnalyticsFilters['metric'], 'all'>,
): boolean {
  // "all" shows every chart; otherwise show only the selected metric
  return metric === 'all' || metric === chart
}
