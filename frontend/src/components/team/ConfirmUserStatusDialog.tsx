/**
 * Confirmation dialog for activating or deactivating a team member.
 */

import { AlertTriangle, X } from 'lucide-react'

import type { User } from '../../types/user.ts'

interface ConfirmUserStatusDialogProps {
  member: User | null
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isPending?: boolean
  error?: string | null
}

export default function ConfirmUserStatusDialog({
  member,
  onClose,
  onConfirm,
  isPending = false,
  error = null,
}: ConfirmUserStatusDialogProps) {
  if (!member) {
    return null
  }

  const isDeactivating = member.status === 'active'
  const title = isDeactivating ? 'Deactivate user' : 'Activate user'
  const actionLabel = isDeactivating ? 'Deactivate user' : 'Activate user'
  const description = isDeactivating
    ? `Deactivate ${member.name}? They will not be able to sign in until the account is activated again.`
    : `Activate ${member.name}? They will be able to sign in again.`

  return (
    <>
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        disabled={isPending}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-status-title"
          className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className={
                  isDeactivating
                    ? 'flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700'
                    : 'flex size-10 items-center justify-center rounded-full bg-green-100 text-green-700'
                }
              >
                <AlertTriangle className="size-5" aria-hidden="true" />
              </div>
              <h3 id="user-status-title" className="text-lg font-semibold text-gray-900">
                {title}
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
            <p className="text-sm text-gray-600">{description}</p>
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
              className={
                isDeactivating
                  ? 'rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50'
                  : 'rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pulse-700 disabled:opacity-50'
              }
            >
              {isPending ? 'Saving...' : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
