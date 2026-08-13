/**
 * Overview page title and subtitle header.
 */

import { Calendar, ChevronDown, Filter, Plus } from 'lucide-react'

export default function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitor your services and incidents at a glance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Calendar className="size-4 text-gray-500" aria-hidden="true" />
          Aug 5 – Aug 12
          <ChevronDown className="size-4 text-gray-400" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Filter className="size-4 text-gray-500" aria-hidden="true" />
          All Services
          <ChevronDown className="size-4 text-gray-400" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pulse-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Service
        </button>
      </div>
    </div>
  )
}
