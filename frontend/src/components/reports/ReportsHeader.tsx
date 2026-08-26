/**
 * Reports page header with JSON/CSV export of the current incident report.
 */

import { Download } from 'lucide-react'

interface ReportsHeaderProps {
  onExportJson?: () => void
  onExportCsv?: () => void
  disableExport?: boolean
}

export default function ReportsHeader({
  onExportJson,
  onExportCsv,
  disableExport = false,
}: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Reports</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Inspect live incident data from MongoDB. Export the current page as JSON or CSV.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onExportJson && (
          <button
            type="button"
            onClick={onExportJson}
            disabled={disableExport}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-4 text-gray-500" aria-hidden="true" />
            Export JSON
          </button>
        )}
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            disabled={disableExport}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pulse-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </button>
        )}
      </div>
    </div>
  )
}
