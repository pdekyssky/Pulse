/**
 * Filter bar for metric type and service scope.
 */

import { ChevronDown, RotateCcw } from 'lucide-react'

import type { AnalyticsFilters, AnalyticsMetric } from '../../types/analytics.ts'
import type { Service } from '../../types/service.ts'
import { defaultAnalyticsFilters } from '../../lib/analytics-stats.ts'

interface AnalyticsFiltersBarProps {
  filters: AnalyticsFilters
  services: Service[]
  onChange: (filters: AnalyticsFilters) => void
}

const metricOptions: Array<{ value: AnalyticsMetric; label: string }> = [
  { value: 'all', label: 'All Metrics' },
  { value: 'uptime', label: 'Uptime' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'responseTime', label: 'Response Time' },
]

export default function AnalyticsFiltersBar({
  filters,
  services,
  onChange,
}: AnalyticsFiltersBarProps) {
  const hasActiveFilters = filters.serviceId !== 'all' || filters.metric !== 'all'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSelect
        value={filters.serviceId}
        options={[
          { value: 'all', label: 'All Services' },
          ...services.map((service) => ({ value: service.id, label: service.name })),
        ]}
        onChange={(serviceId) => onChange({ ...filters, serviceId })}
      />
      <FilterSelect
        value={filters.metric}
        options={metricOptions}
        onChange={(metric) => onChange({ ...filters, metric })}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({ ...filters, ...defaultAnalyticsFilters, dateRange: filters.dateRange })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset
        </button>
      )}
    </div>
  )
}

function FilterSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none sm:w-auto"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
    </div>
  )
}
