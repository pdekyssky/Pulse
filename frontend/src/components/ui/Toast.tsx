/**
 * Transient notification toast with auto-dismiss.
 */

import { CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'

interface ToastProps {
  message: string | null
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) {
      return
    }

    const timer = window.setTimeout(onClose, 3000) // Auto-dismiss after 3 seconds
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  if (!message) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-green-200 bg-white px-4 py-3 shadow-lg"
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">Settings saved</p>
        <p className="mt-0.5 text-sm text-gray-500">{message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
