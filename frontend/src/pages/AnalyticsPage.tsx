/**
 * Analytics dashboard with charts driven by filter-derived data.
 */

import { useMemo, useState } from 'react'

import AnalyticsFiltersBar from '../components/analytics/AnalyticsFilters.tsx'
import AnalyticsHeader from '../components/analytics/AnalyticsHeader.tsx'
import AnalyticsStats from '../components/analytics/AnalyticsStats.tsx'
import IncidentTrendChart from '../components/analytics/IncidentTrendChart.tsx'
import ResponseTimeChart from '../components/analytics/ResponseTimeChart.tsx'
import ServicePerformance from '../components/analytics/ServicePerformance.tsx'
import UptimeChart from '../components/analytics/UptimeChart.tsx'
import {
  defaultAnalyticsFilters,
  getIncidentTrendData,
  getResponseTimeData,
  getServicePerformanceRows,
  getUptimeChartData,
  shouldShowChart,
} from '../lib/analytics-stats.ts'
import type { AnalyticsFilters } from '../types/analytics.ts'

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultAnalyticsFilters)

  const uptimeData = useMemo(() => getUptimeChartData(filters), [filters])
  const incidentData = useMemo(() => getIncidentTrendData(filters), [filters])
  const responseTimeData = useMemo(() => getResponseTimeData(filters), [filters])
  const performanceRows = useMemo(() => getServicePerformanceRows(), [])

  const handleDateRangeChange = (dateRange: AnalyticsFilters['dateRange']) => {
    // Date range lives in the header; merge into existing filter state
    setFilters((current) => ({ ...current, dateRange }))
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader dateRange={filters.dateRange} onDateRangeChange={handleDateRangeChange} />
      <AnalyticsStats />
      <AnalyticsFiltersBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {shouldShowChart(filters.metric, 'uptime') && <UptimeChart data={uptimeData} />}
        {shouldShowChart(filters.metric, 'incidents') && (
          <IncidentTrendChart data={incidentData} />
        )}
        {shouldShowChart(filters.metric, 'responseTime') && (
          <ResponseTimeChart data={responseTimeData} />
        )}
      </div>

      <ServicePerformance rows={performanceRows} />
    </div>
  )
}
