/**
 * Combined incident timeline of created metadata, investigation events, and comments.
 */

import { useState } from 'react'
import {
  AlertCircle,
  ArrowUpCircle,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Pencil,
  PlusCircle,
  Trash2,
  UserPlus,
} from 'lucide-react'

import { buildIncidentTimelineItems } from '../../lib/incident-timeline.ts'
import { formatDateTime, getInitials } from '../../lib/format.ts'
import { cn } from '../../lib/utils.ts'
import type { Incident, IncidentComment, IncidentEvent } from '../../types/incident.ts'
import { investigationEventTypeLabels } from '../../types/incident.ts'
import type { User } from '../../types/user.ts'

const extraEventTypeLabels: Record<string, string> = {
  comment: 'Comment',
  comment_edited: 'Comment edited',
  comment_deleted: 'Comment deleted',
  created: 'Created',
  severity_change: 'Severity change',
  alert_linked: 'Alert linked',
  alert_unlinked: 'Alert unlinked',
}

function eventTypeLabel(event: IncidentEvent): string {
  const source = event.sourceType ?? event.type
  return (
    extraEventTypeLabels[source] ??
    investigationEventTypeLabels[source as keyof typeof investigationEventTypeLabels] ??
    source.replaceAll('_', ' ')
  )
}

interface IncidentTimelineProps {
  incident: Incident
  events: IncidentEvent[]
  comments: IncidentComment[]
  users: User[]
  currentUserId?: string | null
  isAdmin?: boolean
  isPending?: boolean
  onEditComment?: (commentId: string, content: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
}

const eventIcons = {
  note: ClipboardList,
  status_change: AlertCircle,
  comment: MessageSquare,
  assignment: UserPlus,
  escalation: ArrowUpCircle,
  resolution: CheckCircle2,
} as const

const eventIconStyles = {
  note: 'bg-slate-100 text-slate-600',
  status_change: 'bg-purple-100 text-purple-600',
  comment: 'bg-gray-100 text-gray-600',
  assignment: 'bg-blue-100 text-blue-600',
  escalation: 'bg-orange-100 text-orange-600',
  resolution: 'bg-green-100 text-green-600',
} as const

export default function IncidentTimeline({
  incident,
  events,
  comments,
  users,
  currentUserId = null,
  isAdmin = false,
  isPending = false,
  onEditComment,
  onDeleteComment,
}: IncidentTimelineProps) {
  const items = buildIncidentTimelineItems(incident, events, comments)
  const getUserName = (userId?: string) =>
    users.find((user) => user.id === userId)?.name ?? 'Unknown'

  return (
    <div className="space-y-4">
      <div className="space-y-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          if (item.kind === 'created') {
            return (
              <TimelineRow
                key={item.id}
                isLast={isLast}
                icon={PlusCircle}
                iconClassName="bg-pulse-100 text-pulse-700"
                typeLabel="Created"
                timestamp={item.timestamp}
                author={getUserName(item.userId)}
                message={item.message}
              />
            )
          }

          if (item.kind === 'event') {
            const Icon = eventIcons[item.event.type]
            return (
              <TimelineRow
                key={item.id}
                isLast={isLast}
                icon={Icon}
                iconClassName={eventIconStyles[item.event.type]}
                typeLabel={eventTypeLabel(item.event)}
                timestamp={item.timestamp}
                author={getUserName(item.event.userId)}
                message={item.event.message}
              />
            )
          }

          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <MessageSquare className="size-4" aria-hidden="true" />
                </div>
                {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200" />}
              </div>
              <div className={cn('min-w-0 flex-1', !isLast && 'pb-6')}>
                <IncidentCommentItem
                  comment={item.comment}
                  users={users}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  isPending={isPending}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                />
              </div>
            </div>
          )
        })}
      </div>

      {events.length === 0 && (
        <p className="text-xs text-gray-500">
          Status and assignment changes are not recorded as timeline events automatically. Add an
          investigation event below to capture what happened.
        </p>
      )}
    </div>
  )
}

function TimelineRow({
  isLast,
  icon: Icon,
  iconClassName,
  typeLabel,
  timestamp,
  author,
  message,
}: {
  isLast: boolean
  icon: typeof ClipboardList
  iconClassName: string
  typeLabel: string
  timestamp: string
  author: string
  message: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full',
            iconClassName,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200" />}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-6')}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {typeLabel}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-sm font-medium text-gray-900" title={timestamp}>
            {formatDateTime(timestamp)}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{author}</span>
        </div>
        <p className="mt-1 text-sm text-gray-700">{message}</p>
      </div>
    </div>
  )
}

interface IncidentCommentItemProps {
  comment: IncidentComment
  users: User[]
  currentUserId?: string | null
  isAdmin?: boolean
  isPending?: boolean
  onEditComment?: (commentId: string, content: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
}

export function IncidentCommentItem({
  comment,
  users,
  currentUserId = null,
  isAdmin = false,
  isPending = false,
  onEditComment,
  onDeleteComment,
}: IncidentCommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const [editError, setEditError] = useState<string | null>(null)
  const author = users.find((user) => user.id === comment.userId)
  const isOwn = currentUserId !== null && comment.userId === currentUserId
  const canEdit = Boolean(onEditComment) && (isOwn || isAdmin)
  const canDelete = Boolean(onDeleteComment) && (isOwn || isAdmin)

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-pulse-100 text-[10px] font-semibold text-pulse-700">
            {author ? getInitials(author.name) : '?'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Comment
              </span>
              <span className="text-xs text-gray-400">·</span>
              <p className="text-sm font-medium text-gray-900">{author?.name ?? 'Unknown'}</p>
            </div>
            <p className="text-xs text-gray-500" title={comment.timestamp}>
              {formatDateTime(comment.timestamp)}
              {comment.updatedAt && comment.updatedAt !== comment.timestamp
                ? ` · edited ${formatDateTime(comment.updatedAt)}`
                : ''}
            </p>
          </div>
        </div>
        {(canEdit || canDelete) && !isEditing && (
          <div className="flex gap-1">
            {canEdit && (
              <button
                type="button"
                aria-label="Edit comment"
                disabled={isPending}
                onClick={() => {
                  setIsEditing(true)
                  setDraft(comment.content)
                  setEditError(null)
                }}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 disabled:opacity-50"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                aria-label="Delete comment"
                disabled={isPending}
                onClick={() => {
                  void onDeleteComment?.(comment.id)
                }}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none disabled:opacity-50"
          />
          {editError && <p className="text-xs text-red-600">{editError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setIsEditing(false)
                setEditError(null)
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={async () => {
                const content = draft.trim()
                if (!content) {
                  setEditError('Comment cannot be empty')
                  return
                }
                setEditError(null)
                try {
                  await onEditComment?.(comment.id, content)
                  setIsEditing(false)
                } catch {
                  setEditError('Unable to update comment')
                }
              }}
              className="rounded-lg bg-pulse-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pulse-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-700">{comment.content}</p>
      )}
    </div>
  )
}
