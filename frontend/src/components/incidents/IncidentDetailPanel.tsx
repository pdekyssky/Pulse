/**
 * Slide-over panel showing the incident workflow, timeline, and comments.
 */

import { useState } from 'react'
import { CheckCircle2, Pencil, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import type {
  Incident,
  IncidentComment,
  IncidentEvent,
  IncidentPriority,
  IncidentStatus,
  InvestigationEventType,
} from '../../types/incident.ts'
import type { Service } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import IncidentTimeline from './IncidentTimeline.tsx'
import { formatDateTime, formatIncidentId } from '../../lib/format.ts'
import {
  incidentPriorityLabels,
  incidentStatusLabels,
  investigationEventTypeLabels,
  investigationEventTypes,
} from '../../types/incident.ts'
import { parseServiceNumericId } from '../../lib/service-utils.ts'

interface IncidentDetailPanelProps {
  incident: Incident | null
  events: IncidentEvent[]
  comments: IncidentComment[]
  isDetailLoading?: boolean
  detailError?: Error | null
  services: Service[]
  users: User[]
  isAdmin?: boolean
  currentUserId?: string | null
  isMutating?: boolean
  commentError?: string | null
  eventError?: string | null
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onChangeStatus?: (status: IncidentStatus) => void
  onChangeSeverity?: (severity: IncidentPriority) => void
  onChangeAssignee?: (assigneeId: string | null) => void
  onChangeService?: (serviceId: string) => void
  onResolve?: () => void
  onAddComment?: (content: string) => Promise<void>
  onEditComment?: (commentId: string, content: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  onAddEvent?: (eventType: string, message: string) => Promise<void>
}

export default function IncidentDetailPanel({
  incident,
  events,
  comments,
  isDetailLoading = false,
  detailError = null,
  services,
  users,
  isAdmin = false,
  currentUserId = null,
  isMutating = false,
  commentError = null,
  eventError = null,
  onClose,
  onEdit,
  onDelete,
  onChangeStatus,
  onChangeSeverity,
  onChangeAssignee,
  onChangeService,
  onResolve,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddEvent,
}: IncidentDetailPanelProps) {
  const [commentDraft, setCommentDraft] = useState('')
  const [commentValidation, setCommentValidation] = useState<string | null>(null)
  const [eventType, setEventType] = useState<InvestigationEventType>('note')
  const [eventMessage, setEventMessage] = useState('')
  const [eventValidation, setEventValidation] = useState<string | null>(null)

  const handleAddComment = async () => {
    const content = commentDraft.trim()
    if (!content) {
      setCommentValidation('Comment cannot be empty')
      return
    }

    setCommentValidation(null)
    try {
      await onAddComment?.(content)
      setCommentDraft('')
    } catch {
      // Error is shown via commentError from the parent mutation.
    }
  }

  const handleAddEvent = async () => {
    const message = eventMessage.trim()
    if (!message) {
      setEventValidation('Message is required')
      return
    }

    setEventValidation(null)
    try {
      await onAddEvent?.(eventType, message)
      setEventMessage('')
    } catch {
      // Error is shown via eventError from the parent mutation.
    }
  }

  if (!incident) {
    if (!isDetailLoading && !detailError) {
      return null
    }

    return (
      <>
        <button
          type="button"
          aria-label="Close incident details"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl">
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Incident</h3>
            <button
              type="button"
              aria-label="Close panel"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={onClose}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="px-5 py-5">
            {isDetailLoading ? (
              <DetailLoading message="Loading incident..." />
            ) : (
              <DetailError error={detailError ?? new Error('Incident not found')} />
            )}
          </div>
        </aside>
      </>
    )
  }

  const assignee = users.find((user) => user.id === incident.assigneeId)
  const creator = users.find((user) => user.id === incident.createdById)
  const primaryService = incident.affectedServiceIds
    .map((id) => services.find((service) => service.id === id))
    .find((service): service is Service => service !== undefined)
  const assignableUsers = users.filter((user) => user.status !== 'inactive')
  const serviceHref = primaryService
    ? parseServiceNumericId(primaryService.id)
      ? `/services/${parseServiceNumericId(primaryService.id)}`
      : '/services'
    : null
  const hasAdminActions = Boolean(
    onEdit || onDelete || onChangeStatus || onChangeAssignee || onChangeSeverity || onResolve,
  )

  return (
    <>
      <button
        type="button"
        aria-label="Close incident details"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-500">
                {formatIncidentId(incident.id)}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">{incident.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={incidentPriorityLabels[incident.priority]}
                  variant={incident.priority}
                />
                <StatusBadge
                  label={incidentStatusLabels[incident.status]}
                  variant={incident.status}
                />
              </div>
            </div>
            <button
              type="button"
              aria-label="Close panel"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={onClose}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Fact label="Service">
              {primaryService && serviceHref ? (
                <Link to={serviceHref} className="text-pulse-600 hover:text-pulse-700">
                  {primaryService.name}
                </Link>
              ) : (
                '—'
              )}
            </Fact>
            <Fact label="Created by">{creator?.name ?? 'Unknown'}</Fact>
            <Fact label="Assigned to">{assignee?.name ?? 'Unassigned'}</Fact>
            <Fact label="Created">
              {incident.createdAt ? formatDateTime(incident.createdAt) : formatDateTime(incident.startedAt)}
            </Fact>
            <Fact label="Updated">
              {incident.updatedAt ? formatDateTime(incident.updatedAt) : '—'}
            </Fact>
          </dl>

          {isAdmin && hasAdminActions && (
            <div className="mt-5 space-y-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex flex-wrap gap-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </button>
                )}
                {onResolve && incident.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={onResolve}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Resolve
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete
                  </button>
                )}
              </div>

              {onChangeStatus && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-gray-500">
                    Change status
                  </span>
                  <select
                    aria-label="Change status"
                    value={incident.status}
                    disabled={isMutating}
                    onChange={(event) => onChangeStatus(event.target.value as IncidentStatus)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:outline-none disabled:opacity-50"
                  >
                    {(Object.keys(incidentStatusLabels) as IncidentStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {incidentStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {onChangeAssignee && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-gray-500">Assign</span>
                  <select
                    aria-label="Assign incident"
                    value={incident.assigneeId}
                    disabled={isMutating}
                    onChange={(event) =>
                      onChangeAssignee(event.target.value === '' ? null : event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {onChangeSeverity && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-gray-500">Severity</span>
                  <select
                    aria-label="Change severity"
                    value={incident.priority}
                    disabled={isMutating}
                    onChange={(event) =>
                      onChangeSeverity(event.target.value as IncidentPriority)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:outline-none disabled:opacity-50"
                  >
                    {(Object.keys(incidentPriorityLabels) as IncidentPriority[]).map((priority) => (
                      <option key={priority} value={priority}>
                        {incidentPriorityLabels[priority]}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {onChangeService && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-gray-500">Service</span>
                  <select
                    aria-label="Change service"
                    value={incident.affectedServiceIds[0] ?? ''}
                    disabled={isMutating}
                    onChange={(event) => onChangeService(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:outline-none disabled:opacity-50"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          <section className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900">Description</h4>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {incident.description || 'No description provided.'}
            </p>
          </section>

          <section className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900">Timeline</h4>
            <div className="mt-3 space-y-4">
              {isDetailLoading ? (
                <DetailLoading message="Loading timeline..." />
              ) : detailError ? (
                <DetailError error={detailError} />
              ) : (
                <>
                  <IncidentTimeline
                    incident={incident}
                    events={events}
                    comments={comments}
                    users={users}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    isPending={isMutating}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                  />
                  {onAddComment && (
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-medium text-gray-900">Add a comment</p>
                      <textarea
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        rows={3}
                        disabled={isMutating}
                        placeholder="Add a comment..."
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none disabled:opacity-50"
                      />
                      {(commentValidation || commentError) && (
                        <p className="mt-2 text-xs text-red-600">
                          {commentValidation ?? commentError}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleAddComment()}
                        disabled={isMutating}
                        className="mt-2 rounded-lg bg-pulse-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pulse-700 disabled:opacity-50"
                      >
                        Add comment
                      </button>
                    </div>
                  )}
                  {onAddEvent && (
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-medium text-gray-900">Add an investigation event</p>
                      <select
                        value={eventType}
                        disabled={isMutating}
                        onChange={(event) =>
                          setEventType(event.target.value as InvestigationEventType)
                        }
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-pulse-500 focus:outline-none disabled:opacity-50"
                      >
                        {investigationEventTypes.map((type) => (
                          <option key={type} value={type}>
                            {investigationEventTypeLabels[type]}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={eventMessage}
                        onChange={(event) => setEventMessage(event.target.value)}
                        rows={3}
                        disabled={isMutating}
                        placeholder="What happened during investigation?"
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20 focus:outline-none disabled:opacity-50"
                      />
                      {(eventValidation || eventError) && (
                        <p className="mt-2 text-xs text-red-600">{eventValidation ?? eventError}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleAddEvent()}
                        disabled={isMutating}
                        className="mt-2 rounded-lg bg-pulse-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pulse-700 disabled:opacity-50"
                      >
                        Add event
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  )
}

function DetailLoading({ message }: { message: string }) {
  return <p className="text-sm text-gray-500">{message}</p>
}

function DetailError({ error }: { error: Error }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h4 className="text-sm font-semibold text-red-800">Unable to load incident details</h4>
      <p className="mt-1 text-sm text-red-700">{error.message}</p>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 px-3 py-2.5">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{children}</dd>
    </div>
  )
}
