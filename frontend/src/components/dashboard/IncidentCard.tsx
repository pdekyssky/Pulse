/**
 * Compact incident summary card for the overview list.
 */

import { Link } from 'react-router-dom'

import type { Incident } from '../../types/incident.ts'
import type { User } from '../../types/user.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import {
  formatIncidentId,
  formatRelativeTime,
  formatTime,
  getInitials,
} from '../../lib/format.ts'
import { parseIncidentNumericId } from '../../lib/incident-utils.ts'

interface IncidentCardProps {
  incident: Incident
  assignee?: User
}

export default function IncidentCard({ incident, assignee }: IncidentCardProps) {
  const numericId = parseIncidentNumericId(incident.id)
  const href = numericId ? `/incidents/${numericId}` : '/incidents'

  return (
    <Link
      to={href}
      className="block rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:border-gray-200 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">
              {formatIncidentId(incident.id)}
            </span>
            <StatusBadge label={incident.priority} variant={incident.priority} />
          </div>
          <h4 className="font-medium text-gray-900">{incident.title}</h4>
          <p className="text-xs text-gray-500">
            Started {formatTime(incident.startedAt)} · {formatRelativeTime(incident.startedAt)} ·{' '}
            {incident.duration}
          </p>
        </div>

        {assignee && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div
              className="flex size-8 items-center justify-center rounded-full bg-pulse-100 text-xs font-semibold text-pulse-700"
              title={assignee.name}
            >
              {assignee.avatar ? (
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                getInitials(assignee.name)
              )}
            </div>
            <span className="max-w-16 truncate text-[10px] text-gray-500">{assignee.name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
