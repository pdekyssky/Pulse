/**
 * Analytics dashboard with charts driven by API-backed aggregated data.
 */

import { useMemo, useState } from 'react'

import AnalyticsFiltersBar from '../components/analytics/AnalyticsFilters.tsx'
import AnalyticsHeader from '../components/analytics/AnalyticsHeader.tsx'
import AnalyticsStats from '../components/analytics/AnalyticsStats.tsx'
import IncidentTrendChart from '../components/analytics/IncidentTrendChart.tsx'
import ResponseTimeChart from '../components/analytics/ResponseTimeChart.tsx'
import ServicePerformance from '../components/analytics/ServicePerformance.tsx'
import UptimeChart from '../components/analytics/UptimeChart.tsx'
import QueryState from '../components/common/QueryState.tsx'
import { useAnalyticsOverview } from '../hooks/useAnalyticsQuery.ts'
import { useServices } from '../hooks/useServices.ts'
import { defaultAnalyticsFilters, shouldShowChart } from '../lib/analytics-stats.ts'
import { buildAnalyticsOverviewParams } from '../lib/mappers/analytics.ts'
import type { AnalyticsFilters, AnalyticsKpis } from '../types/analytics.ts'

const emptyKpis: AnalyticsKpis = {
  overallUptime: '0.00%',
  averageResponseTime: '0 ms',
  totalIncidents: 0,
  mttr: '0m',
  alertVolume: 0,
}

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultAnalyticsFilters)

  const queryParams = useMemo(
    () => buildAnalyticsOverviewParams(filters),
    [filters.dateRange, filters.serviceId],
  )

  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = useAnalyticsOverview(queryParams)
  const { data: services = [], isLoading: isServicesLoading, error: servicesError } = useServices()

  const handleDateRangeChange = (dateRange: AnalyticsFilters['dateRange']) => {
    setFilters((current) => ({ ...current, dateRange }))
  }

  const isLoading =
    (isServicesLoading && services.length === 0) ||
    (isAnalyticsLoading && analyticsData === undefined)
  const error = analyticsError ?? servicesError

  const kpis = analyticsData?.kpis ?? emptyKpis
  const uptimeData = analyticsData?.uptimeSeries ?? []
  const incidentData = analyticsData?.incidentTrend ?? []
  const responseTimeData = analyticsData?.responseTimeSeries ?? []
  const performanceRows = analyticsData?.servicePerformance ?? []

  return (
    <QueryState isLoading={isLoading} error={error} loadingMessage="Loading analytics...">
      <div className="space-y-6">
        <AnalyticsHeader dateRange={filters.dateRange} onDateRangeChange={handleDateRangeChange} />
        <AnalyticsStats kpis={kpis} />
        <AnalyticsFiltersBar filters={filters} services={services} onChange={setFilters} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {shouldShowChart(filters.metric, 'uptime') && <UptimeChart data={uptimeData} />}
          {shouldShowChart(filters.metric, 'incidents') && (
            <IncidentTrendChart data={incidentData} />
          )}
          {shouldShowChart(filters.metric, 'responseTime') && (
            <ResponseTimeChart data={responseTimeData} />
          )}
        </div>

        <ServicePerformance rows={performanceRows} services={services} />
      </div>
    </QueryState>
  )
}
