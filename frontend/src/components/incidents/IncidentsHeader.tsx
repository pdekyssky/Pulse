/**
 * Incidents page header with create-incident action.
 */

import { Plus } from 'lucide-react'

interface IncidentsHeaderProps {
  onCreateClick?: () => void
}

export default function IncidentsHeader({ onCreateClick }: IncidentsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Incidents</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Track, investigate, and resolve service incidents across your infrastructure.
        </p>
      </div>

      {onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pulse-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Create Incident
        </button>
      )}
    </div>
  )
}
