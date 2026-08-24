/**
 * Reports page header with optional generate-report action.
 */

import { Plus } from 'lucide-react'

interface ReportsHeaderProps {
  readOnly?: boolean
  onGenerateClick?: () => void
}

export default function ReportsHeader({ readOnly = false, onGenerateClick }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Reports</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Generate and review operational reports for your services and incidents.
        </p>
      </div>

      {!readOnly && onGenerateClick && (
        <button
          type="button"
          onClick={onGenerateClick}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pulse-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Generate Report
        </button>
      )}
    </div>
  )
}
