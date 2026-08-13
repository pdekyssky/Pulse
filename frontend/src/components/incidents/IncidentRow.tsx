/**
 * Single incident row with status, priority, and resolve action.
 */

import { Eye, MoreHorizontal, Pencil, CheckCircle2 } from 'lucide-react'

import type { Incident } from '../../types/incident.ts'
import type { Service } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import {
  formatDateTime,
  formatIncidentId,
  formatRelativeTime,
  formatTime,
  getInitials,
} from '../../lib/format.ts'
import {
  incidentPriorityLabels,
  incidentStatusLabels,
} from '../../types/incident.ts'

interface IncidentRowProps {
  incident: Incident
  primaryService?: Service
  assignee?: User
  onSelect: (incident: Incident) => void
  onResolve: (incident: Incident) => void
}

export default function IncidentRow({
  incident,
  primaryService,
  assignee,
  onSelect,
  onResolve,
}: IncidentRowProps) {
  return (
    <tr
      className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
      onClick={() => onSelect(incident)}
    >
      <td className="px-5 py-4 pr-4">
        <span className="text-sm font-semibold text-gray-500">
          {formatIncidentId(incident.id)}
        </span>
      </td>
      <td className="py-4 pr-4">
        <p className="max-w-xs truncate font-medium text-gray-900">{incident.title}</p>
      </td>
      <td className="py-4 pr-4">
        <StatusBadge label={incidentStatusLabels[incident.status]} variant={incident.status} />
      </td>
      <td className="py-4 pr-4">
        <StatusBadge
          label={incidentPriorityLabels[incident.priority]}
          variant={incident.priority}
        />
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 md:table-cell">
        {primaryService?.name ?? '—'}
      </td>
      <td className="hidden py-4 pr-4 lg:table-cell">
        {assignee ? (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-pulse-100 text-[10px] font-semibold text-pulse-700">
              {getInitials(assignee.name)}
            </div>
            <span className="text-sm text-gray-700">{assignee.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 sm:table-cell">
        {formatTime(incident.startedAt)}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 xl:table-cell">
        {incident.duration}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {incident.status !== 'resolved' && (
            <button
              type="button"
              title="Resolve"
              aria-label={`Resolve ${formatIncidentId(incident.id)}`}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
              onClick={(event) => {
                event.stopPropagation()
                onResolve(incident)
              }}
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            title="View"
            aria-label={`View ${formatIncidentId(incident.id)}`}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={(event) => {
              event.stopPropagation()
              onSelect(incident)
            }}
          >
            <Eye className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Edit"
            aria-label={`Edit ${formatIncidentId(incident.id)}`}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={(event) => {
              event.stopPropagation()
              onSelect(incident)
            }}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`More actions for ${formatIncidentId(incident.id)}`}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={(event) => {
              event.stopPropagation()
              onSelect(incident)
            }}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function IncidentMobileCard({
  incident,
  primaryService,
  assignee,
  onSelect,
}: Omit<IncidentRowProps, 'onResolve'>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(incident)}
      className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 text-left transition-colors hover:border-gray-200 hover:bg-white"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">
          {formatIncidentId(incident.id)}
        </span>
        <StatusBadge label={incidentStatusLabels[incident.status]} variant={incident.status} />
        <StatusBadge
          label={incidentPriorityLabels[incident.priority]}
          variant={incident.priority}
        />
      </div>
      <p className="mt-2 font-medium text-gray-900">{incident.title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <span>Service: {primaryService?.name ?? '—'}</span>
        <span>Assignee: {assignee?.name ?? '—'}</span>
        <span>Started: {formatTime(incident.startedAt)}</span>
        <span>Duration: {incident.duration}</span>
        <span className="col-span-2">{formatRelativeTime(incident.startedAt)} · {formatDateTime(incident.startedAt)}</span>
      </div>
    </button>
  )
}
