/**
 * Filter bar for searching and narrowing incident list.
 */

import { ChevronDown, Search } from 'lucide-react'

import type { IncidentFilters as IncidentFiltersState } from '../../lib/incident-stats.ts'
import type { Service } from '../../types/service.ts'
import {
  incidentPriorityLabels,
  incidentStatusLabels,
  type IncidentPriority,
  type IncidentStatus,
} from '../../types/incident.ts'

interface IncidentFiltersProps {
  filters: IncidentFiltersState
  services: Service[]
  onChange: (filters: IncidentFiltersState) => void
}

const statusOptions: Array<{ value: IncidentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  ...Object.entries(incidentStatusLabels).map(([value, label]) => ({
    value: value as IncidentStatus,
    label,
  })),
]

const priorityOptions: Array<{ value: IncidentPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All Priorities' },
  ...Object.entries(incidentPriorityLabels).map(([value, label]) => ({
    value: value as IncidentPriority,
    label,
  })),
]

const dateOptions = [
  { value: 'all' as const, label: 'All Time' },
  { value: '7d' as const, label: 'Last 7 Days' },
  { value: '30d' as const, label: 'Last 30 Days' },
]

export default function IncidentFilters({ filters, services, onChange }: IncidentFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by title or ID..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none"
        />
      </div>

      <FilterSelect
        value={filters.status}
        options={statusOptions}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <FilterSelect
        value={filters.priority}
        options={priorityOptions}
        onChange={(priority) => onChange({ ...filters, priority })}
      />
      <FilterSelect
        value={filters.serviceId}
        options={[
          { value: 'all', label: 'All Services' },
          ...services.map((service) => ({ value: service.id, label: service.name })),
        ]}
        onChange={(serviceId) => onChange({ ...filters, serviceId })}
      />
      <FilterSelect
        value={filters.dateRange}
        options={dateOptions}
        onChange={(dateRange) => onChange({ ...filters, dateRange })}
      />
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
