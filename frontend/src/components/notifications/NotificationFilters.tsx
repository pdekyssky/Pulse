/**
 * Read-status filter for the notifications list.
 */

import { ChevronDown, RotateCcw } from 'lucide-react'

import {
  defaultNotificationFilters,
  type NotificationFilters as NotificationFiltersState,
  type NotificationReadFilter,
} from '../../lib/notification-filters.ts'

interface NotificationFiltersProps {
  filters: NotificationFiltersState
  onChange: (filters: NotificationFiltersState) => void
}

const readStatusOptions: Array<{ value: NotificationReadFilter; label: string }> = [
  { value: 'all', label: 'All Notifications' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export default function NotificationFilters({
  filters,
  onChange,
}: NotificationFiltersProps) {
  const hasActiveFilters = filters.readStatus !== 'all'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative">
        <select
          value={filters.readStatus}
          onChange={(event) =>
            onChange({ ...filters, readStatus: event.target.value as NotificationReadFilter })
          }
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none sm:w-auto"
        >
          {readStatusOptions.map((option) => (
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
          onClick={() => onChange(defaultNotificationFilters)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset
        </button>
      )}
    </div>
  )
}
