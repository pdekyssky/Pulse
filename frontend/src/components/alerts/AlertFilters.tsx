/**
 * Filter bar for alert search, severity, and status.
 */

import { ChevronDown, RotateCcw, Search } from 'lucide-react'

import {
  defaultAlertFilters,
  type AlertFilters as AlertFiltersState,
} from '../../lib/alert-stats.ts'
import type { Service } from '../../types/service.ts'
import type { AlertSeverity, AlertStatus } from '../../types/alert.ts'
import { alertSeverityLabels, alertStatusLabels } from '../../types/alert.ts'

interface AlertFiltersProps {
  filters: AlertFiltersState
  services: Service[]
  onChange: (filters: AlertFiltersState) => void
}

const severityOptions: Array<{ value: AlertSeverity | 'all'; label: string }> = [
  { value: 'all', label: 'All Severities' },
  ...Object.entries(alertSeverityLabels).map(([value, label]) => ({
    value: value as AlertSeverity,
    label,
  })),
]

const statusOptions: Array<{ value: AlertStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  ...Object.entries(alertStatusLabels).map(([value, label]) => ({
    value: value as AlertStatus,
    label,
  })),
]

export default function AlertFilters({ filters, services, onChange }: AlertFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.severity !== 'all' ||
    filters.status !== 'all' ||
    filters.serviceId !== 'all'

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search alerts..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none"
        />
      </div>

      <FilterSelect
        value={filters.severity}
        options={severityOptions}
        onChange={(severity) => onChange({ ...filters, severity })}
      />
      <FilterSelect
        value={filters.status}
        options={statusOptions}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <FilterSelect
        value={filters.serviceId}
        options={[
          { value: 'all', label: 'All Services' },
          ...services.map((service) => ({ value: service.id, label: service.name })),
        ]}
        onChange={(serviceId) => onChange({ ...filters, serviceId })}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange(defaultAlertFilters)}
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
        className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none lg:w-auto"
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
