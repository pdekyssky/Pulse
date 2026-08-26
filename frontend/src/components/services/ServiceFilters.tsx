/**
 * Filter bar for service search and status.
 */

import { ChevronDown, RotateCcw, Search } from 'lucide-react'

import {
  defaultServiceFilters,
  type ServiceFilters as ServiceFiltersState,
} from '../../lib/service-stats.ts'
import type { ServiceStatus } from '../../types/service.ts'

interface ServiceFiltersProps {
  filters: ServiceFiltersState
  onChange: (filters: ServiceFiltersState) => void
}

const statusOptions: Array<{ value: ServiceStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'operational', label: 'Operational' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'down', label: 'Down' },
]

export default function ServiceFilters({ filters, onChange }: ServiceFiltersProps) {
  const hasActiveFilters = filters.search !== '' || filters.status !== 'all'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search services..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none"
        />
      </div>

      <div className="relative">
        <select
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as ServiceStatus | 'all' })
          }
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none sm:w-auto"
        >
          {statusOptions.map((option) => (
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

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange(defaultServiceFilters)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset
        </button>
      )}
    </div>
  )
}
