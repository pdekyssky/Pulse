/**
 * Confirmation dialog for deleting an incident.
 */

import { AlertTriangle, X } from 'lucide-react'

import type { Incident } from '../../types/incident.ts'
import { formatIncidentId } from '../../lib/format.ts'

interface ConfirmIncidentDeleteDialogProps {
  incident: Incident | null
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isPending?: boolean
  error?: string | null
}

export default function ConfirmIncidentDeleteDialog({
  incident,
  onClose,
  onConfirm,
  isPending = false,
  error = null,
}: ConfirmIncidentDeleteDialogProps) {
  if (!incident) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onClose}
        disabled={isPending}
      />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-incident-title"
          className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </div>
              <h3 id="delete-incident-title" className="text-lg font-semibold text-gray-900">
                Delete incident?
              </h3>
            </div>
            <button
              type="button"
              aria-label="Close"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              onClick={onClose}
              disabled={isPending}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="px-5 py-4">
            <p className="text-sm text-gray-600">
              Delete{' '}
              <span className="font-medium text-gray-900">{formatIncidentId(incident.id)}</span>{' '}
              “{incident.title}”? Comments and events for this incident will also be removed. This
              cannot be undone.
            </p>
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Deleting...' : 'Delete incident'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
