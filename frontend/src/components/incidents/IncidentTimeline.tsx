/**
 * Vertical timeline of incident status and assignment events.
 */

import {
  AlertCircle,
  ArrowUpCircle,
  CheckCircle2,
  MessageSquare,
  UserPlus,
} from 'lucide-react'

import type { Incident, IncidentEvent } from '../../types/incident.ts'
import type { User } from '../../types/user.ts'
import { formatTime, getInitials } from '../../lib/format.ts'
import { cn } from '../../lib/utils.ts'

interface IncidentTimelineProps {
  events: IncidentEvent[]
  users: User[]
}

const eventIcons = {
  status_change: AlertCircle,
  comment: MessageSquare,
  assignment: UserPlus,
  escalation: ArrowUpCircle,
  resolution: CheckCircle2,
} as const

const eventIconStyles = {
  status_change: 'bg-purple-100 text-purple-600',
  comment: 'bg-gray-100 text-gray-600',
  assignment: 'bg-blue-100 text-blue-600',
  escalation: 'bg-orange-100 text-orange-600',
  resolution: 'bg-green-100 text-green-600',
} as const

export default function IncidentTimeline({ events, users }: IncidentTimelineProps) {
  const getUserName = (userId?: string) =>
    users.find((user) => user.id === userId)?.name ?? 'System'

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const Icon = eventIcons[event.type]
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  eventIconStyles[event.type],
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200" />}
            </div>

            <div className={cn('min-w-0 flex-1', !isLast && 'pb-6')}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {formatTime(event.timestamp)}
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{getUserName(event.userId)}</span>
              </div>
              <p className="mt-1 text-sm text-gray-700">{event.message}</p>
            </div>
          </div>
        )
      })}

      <div className="flex gap-3 opacity-40">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
          <CheckCircle2 className="size-4 text-gray-400" aria-hidden="true" />
        </div>
        <p className="pt-1.5 text-sm text-gray-400">Resolved</p>
      </div>
    </div>
  )
}

export function IncidentCommentList({
  comments,
  users,
}: {
  comments: Incident['comments']
  users: User[]
}) {
  if (comments.length === 0) {
    return <p className="text-sm text-gray-500">No comments yet.</p>
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const author = users.find((user) => user.id === comment.userId)

        return (
          <div key={comment.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-pulse-100 text-[10px] font-semibold text-pulse-700">
                {author ? getInitials(author.name) : '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{author?.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500">{formatTime(comment.timestamp)}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-700">{comment.content}</p>
          </div>
        )
      })}
    </div>
  )
}
