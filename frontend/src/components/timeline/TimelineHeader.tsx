/**
 * Timeline page title header.
 */

import { Filter } from 'lucide-react'

export default function TimelineHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Timeline</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          View a chronological history of incidents, alerts, and service activity.
        </p>
      </div>

      <button
        type="button"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <Filter className="size-4 text-gray-500" aria-hidden="true" />
        Export
      </button>
    </div>
  )
}
