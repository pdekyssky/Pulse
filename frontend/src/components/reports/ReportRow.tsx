/**
 * Single incident report row.
 */

import { Eye } from 'lucide-react'

import type { IncidentReportRow } from '../../lib/mappers/report.ts'
import { formatDateTime, formatIncidentId } from '../../lib/format.ts'
import { incidentPriorityLabels, incidentStatusLabels } from '../../types/incident.ts'
import StatusBadge from '../ui/StatusBadge.tsx'

interface ReportRowProps {
  report: IncidentReportRow
  onView: (report: IncidentReportRow) => void
}

export default function ReportRow({ report, onView }: ReportRowProps) {
  return (
    <tr
      className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
      onClick={() => onView(report)}
    >
      <td className="px-5 py-4 pr-4">
        <p className="font-medium text-gray-900">{report.title}</p>
        <p className="text-xs text-gray-500">{formatIncidentId(String(report.id))}</p>
      </td>
      <td className="py-4 pr-4">
        <StatusBadge label={incidentPriorityLabels[report.severity]} variant={report.severity} />
      </td>
      <td className="py-4 pr-4">
        <StatusBadge label={incidentStatusLabels[report.status]} variant={report.status} />
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-700 md:table-cell">
        {report.serviceName ?? '—'}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 lg:table-cell">
        {formatDateTime(report.createdAt)}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 xl:table-cell">
        {report.resolvedAt ? formatDateTime(report.resolvedAt) : '—'}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-700 lg:table-cell">
        {report.assignedToName ?? 'Unassigned'}
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          aria-label={`Open ${formatIncidentId(String(report.id))}`}
          onClick={(event) => {
            event.stopPropagation()
            onView(report)
          }}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <Eye className="size-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}

export function ReportMobileCard({ report, onView }: ReportRowProps) {
  return (
    <button
      type="button"
      onClick={() => onView(report)}
      className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 text-left transition-colors hover:border-gray-200 hover:bg-white"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">
          {formatIncidentId(String(report.id))}
        </span>
        <StatusBadge label={incidentPriorityLabels[report.severity]} variant={report.severity} />
        <StatusBadge label={incidentStatusLabels[report.status]} variant={report.status} />
      </div>
      <p className="mt-2 font-medium text-gray-900">{report.title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <span>Service: {report.serviceName ?? '—'}</span>
        <span>Assignee: {report.assignedToName ?? 'Unassigned'}</span>
        <span>Created: {formatDateTime(report.createdAt)}</span>
        <span>Resolved: {report.resolvedAt ? formatDateTime(report.resolvedAt) : '—'}</span>
      </div>
    </button>
  )
}
