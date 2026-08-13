/**
 * Filter bar for member search, role, and status.
 */

import { ChevronDown, RotateCcw, Search } from 'lucide-react'

import {
  defaultTeamFilters,
  type TeamFilters as TeamFiltersState,
} from '../../lib/team-stats.ts'
import type { UserRole, UserStatus } from '../../types/user.ts'
import { userRoleLabels, userStatusLabels } from '../../types/user.ts'

interface TeamFiltersProps {
  filters: TeamFiltersState
  onChange: (filters: TeamFiltersState) => void
}

const roleOptions: Array<{ value: UserRole | 'all'; label: string }> = [
  { value: 'all', label: 'All Roles' },
  ...Object.entries(userRoleLabels).map(([value, label]) => ({
    value: value as UserRole,
    label,
  })),
]

const statusOptions: Array<{ value: UserStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  ...Object.entries(userStatusLabels).map(([value, label]) => ({
    value: value as UserStatus,
    label,
  })),
]

export default function TeamFilters({ filters, onChange }: TeamFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' || filters.role !== 'all' || filters.status !== 'all'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none"
        />
      </div>

      <FilterSelect
        value={filters.role}
        options={roleOptions}
        onChange={(role) => onChange({ ...filters, role })}
      />

      <FilterSelect
        value={filters.status}
        options={statusOptions}
        onChange={(status) => onChange({ ...filters, status })}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange(defaultTeamFilters)}
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
