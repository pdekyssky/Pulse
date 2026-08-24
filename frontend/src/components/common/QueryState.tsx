/**
 * Shared loading and error states for query-driven pages.
 */

import type { ReactNode } from 'react'

interface QueryStateProps {
  isLoading: boolean
  error: Error | null
  loadingMessage?: string
  children: ReactNode
}

export default function QueryState({
  isLoading,
  error,
  loadingMessage = 'Loading...',
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-gray-200 bg-white p-8">
        <p className="text-sm text-gray-500">{loadingMessage}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-sm font-semibold text-red-800">Unable to load data</h3>
        <p className="mt-1 text-sm text-red-700">{error.message}</p>
      </div>
    )
  }

  return children
}
