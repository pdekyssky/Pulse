/**
 * Confirmation dialog for deleting a report.
 */

import { AlertTriangle, X } from 'lucide-react'

import type { Report } from '../../types/report.ts'

interface DeleteReportDialogProps {
  report: Report | null
  onClose: () => void
  onConfirm: (report: Report) => void
}

export default function DeleteReportDialog({
  report,
  onClose,
  onConfirm,
}: DeleteReportDialogProps) {
  if (!report) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-report-title"
          className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </div>
              <h3 id="delete-report-title" className="text-lg font-semibold text-gray-900">
                Delete Report
              </h3>
            </div>
            <button
              type="button"
              aria-label="Close"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={onClose}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="px-5 py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">{report.name}</span>? This action cannot
              be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(report)
                onClose()
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete Report
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
