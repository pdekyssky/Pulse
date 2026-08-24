/**
 * Minimal previous/next pagination for the timeline list.
 */

interface TimelinePaginationProps {
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

export default function TimelinePagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: TimelinePaginationProps) {
  if (totalPages <= 0) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}
