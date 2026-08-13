/**
 * Analytics page header with date range selector.
 */

import { Calendar, Download } from 'lucide-react'

import type { AnalyticsDateRange } from '../../types/analytics.ts'

interface AnalyticsHeaderProps {
  dateRange: AnalyticsDateRange
  onDateRangeChange: (range: AnalyticsDateRange) => void
}

const dateRangeLabels: Record<AnalyticsDateRange, string> = {
  '7d': 'Last 7 days',
  '14d': 'Last 14 days',
  '30d': 'Last 30 days',
}

export default function AnalyticsHeader({
  dateRange,
  onDateRangeChange,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Analytics</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Analyze service health, incidents, and operational performance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Calendar
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <select
            value={dateRange}
            onChange={(event) => onDateRangeChange(event.target.value as AnalyticsDateRange)}
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pr-9 pl-9 text-sm font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none"
          >
            {Object.entries(dateRangeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Download className="size-4 text-gray-500" aria-hidden="true" />
          Export
        </button>
      </div>
    </div>
  )
}
