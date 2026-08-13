/**
 * Colored badge for report generation status.
 */

import type { ReportStatus } from '../../types/report.ts'
import { reportStatusLabels } from '../../types/report.ts'
import { cn } from '../../lib/utils.ts'

interface ReportStatusBadgeProps {
  status: ReportStatus
  className?: string
}

const statusStyles: Record<ReportStatus, string> = {
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  generating: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  scheduled: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  failed: 'bg-red-50 text-red-700 ring-red-600/20',
}

export default function ReportStatusBadge({ status, className }: ReportStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset',
        statusStyles[status],
        className,
      )}
    >
      {reportStatusLabels[status]}
    </span>
  )
}
