/**
 * Analytics dashboard driven by live MongoDB aggregates.
 */

import { useMemo, useState } from 'react'

import AnalyticsFiltersBar from '../components/analytics/AnalyticsFilters.tsx'
import AnalyticsHeader from '../components/analytics/AnalyticsHeader.tsx'
import AnalyticsStats from '../components/analytics/AnalyticsStats.tsx'
import DistributionList from '../components/analytics/DistributionList.tsx'
import IncidentTrendChart from '../components/analytics/IncidentTrendChart.tsx'
import ServicePerformance from '../components/analytics/ServicePerformance.tsx'
import QueryState from '../components/common/QueryState.tsx'
import StatCard from '../components/dashboard/StatCard.tsx'
import { useAnalyticsOverview } from '../hooks/useAnalyticsQuery.ts'
import { useServices } from '../hooks/useServices.ts'
import { defaultAnalyticsFilters, downloadAnalyticsJson } from '../lib/analytics-stats.ts'
import { buildAnalyticsOverviewParams } from '../lib/mappers/analytics.ts'
import { incidentPriorityLabels, incidentStatusLabels } from '../types/incident.ts'
import type { AnalyticsFilters } from '../types/analytics.ts'
import { AlertTriangle, Server, ShieldAlert } from 'lucide-react'

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultAnalyticsFilters)

  const queryParams = useMemo(
    () => buildAnalyticsOverviewParams(filters),
    [filters.dateRange, filters.serviceId],
  )

  const {
    data: overview,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = useAnalyticsOverview(queryParams)
  const { data: services = [], isLoading: isServicesLoading, error: servicesError } = useServices()

  const handleDateRangeChange = (dateRange: AnalyticsFilters['dateRange']) => {
    setFilters((current) => ({ ...current, dateRange }))
  }

  const isLoading =
    (isServicesLoading && services.length === 0) ||
    (isAnalyticsLoading && overview === undefined)
  const error = analyticsError ?? servicesError

  const severityItems = overview
    ? Object.entries(overview.incidents.bySeverity).map(([key, count]) => ({
        key,
        label: incidentPriorityLabels[key as keyof typeof incidentPriorityLabels] ?? key,
        count,
      }))
    : []

  const statusItems = overview
    ? Object.entries(overview.incidents.byStatus).map(([key, count]) => ({
        key,
        label: incidentStatusLabels[key as keyof typeof incidentStatusLabels] ?? key,
        count,
      }))
    : []

  const serviceItems = overview
    ? overview.incidents.byService.map((row) => ({
        key: String(row.serviceId ?? row.serviceName),
        label: row.serviceName,
        count: row.count,
      }))
    : []

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading analytics..."
      errorTitle="Unable to load analytics"
    >
      <div className="space-y-6">
        <AnalyticsHeader
          dateRange={filters.dateRange}
          onDateRangeChange={handleDateRangeChange}
          onExport={overview ? () => downloadAnalyticsJson(overview) : undefined}
        />
        {overview && <AnalyticsStats overview={overview} />}
        <AnalyticsFiltersBar filters={filters} services={services} onChange={setFilters} />

        {overview && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Operational"
                value={overview.services.operational}
                icon={Server}
                variant="operational"
              />
              <StatCard
                label="Degraded"
                value={overview.services.degraded}
                icon={AlertTriangle}
                variant="degraded"
              />
              <StatCard
                label="Down"
                value={overview.services.down}
                icon={ShieldAlert}
                variant="down"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <DistributionList
                title="Severity Distribution"
                description="Incidents created in the selected period."
                items={severityItems}
                emptyMessage="No incidents in this period."
              />
              <DistributionList
                title="Status Distribution"
                description="Current status of incidents created in the selected period."
                items={statusItems}
                emptyMessage="No incidents in this period."
              />
            </div>

            <IncidentTrendChart data={overview.incidentTrend} />

            <DistributionList
              title="Incidents by Service"
              description="Incident volume grouped by affected service."
              items={serviceItems}
              emptyMessage="No incidents in this period."
            />

            <ServicePerformance rows={overview.services.items} />
          </>
        )}
      </div>
    </QueryState>
  )
}
