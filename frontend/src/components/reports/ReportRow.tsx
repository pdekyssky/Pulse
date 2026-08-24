/**
 * Single report row with status badge and action buttons.
 */

import { Download, Eye, FileText, Trash2 } from 'lucide-react'

import type { Report } from '../../types/report.ts'
import type { User } from '../../types/user.ts'
import { formatDateRange, formatDateTime, formatRelativeTime, getInitials } from '../../lib/format.ts'
import { reportTypeLabels } from '../../types/report.ts'
import ReportStatusBadge from './ReportStatusBadge.tsx'

interface ReportRowProps {
  report: Report
  author?: User
  readOnly?: boolean
  onView: (report: Report) => void
  onDownload: (report: Report) => void
  onDelete?: (report: Report) => void
}

export default function ReportRow({
  report,
  author,
  readOnly = false,
  onView,
  onDownload,
  onDelete,
}: ReportRowProps) {
  return (
    <tr className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50">
      <td className="px-5 py-4 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <FileText className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{report.name}</p>
            <p className="truncate text-xs text-gray-500 md:hidden">
              {reportTypeLabels[report.type]}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 md:table-cell">
        {reportTypeLabels[report.type]}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 lg:table-cell">
        {formatDateRange(report.periodStart, report.periodEnd)}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 sm:table-cell">
        <span title={formatDateTime(report.createdAt)}>
          {formatRelativeTime(report.createdAt)}
        </span>
      </td>
      <td className="py-4 pr-4">
        <ReportStatusBadge status={report.status} />
      </td>
      <td className="hidden py-4 pr-4 lg:table-cell">
        {author ? (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-pulse-100 text-[10px] font-semibold text-pulse-700">
              {getInitials(author.name)}
            </div>
            <span className="truncate text-sm text-gray-700">{author.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Unknown</span>
        )}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            aria-label={`View ${report.name}`}
            onClick={() => onView(report)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <Eye className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Download ${report.name}`}
            onClick={() => onDownload(report)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <Download className="size-4" aria-hidden="true" />
          </button>
          {!readOnly && onDelete && (
            <button
              type="button"
              aria-label={`Delete ${report.name}`}
              onClick={() => onDelete(report)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export function ReportMobileCard({
  report,
  author,
  readOnly = false,
  onView,
  onDownload,
  onDelete,
}: ReportRowProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <FileText className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{report.name}</p>
            <p className="text-xs text-gray-500">{reportTypeLabels[report.type]}</p>
          </div>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <span className="col-span-2">
          Period: {formatDateRange(report.periodStart, report.periodEnd)}
        </span>
        <span>Created: {formatRelativeTime(report.createdAt)}</span>
        <span>By: {author?.name ?? 'Unknown'}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onView(report)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View
        </button>
        <button
          type="button"
          onClick={() => onDownload(report)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Export
        </button>
        {!readOnly && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(report)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
