import type {
  ApiIncident,
  ApiIncidentComment,
  ApiIncidentCommentCreate,
  ApiIncidentCommentUpdate,
  ApiIncidentCreate,
  ApiIncidentEvent,
  ApiIncidentSeverity,
  ApiIncidentUpdate,
} from '../../types/api/incident.ts'
import type {
  CreateIncidentInput,
  Incident,
  IncidentComment,
  IncidentEvent,
  IncidentEventType,
  IncidentPriority,
} from '../../types/incident.ts'
import { mapRecentIncidentToIncident } from './dashboard.ts'

/** Backend-required create fields not collected by `CreateIncidentInput`. */
export type CreateIncidentRequiredApiFields = Pick<ApiIncidentCreate, 'status' | 'started_at'>

function parseServiceId(serviceId: string): number {
  const service_id = Number.parseInt(serviceId, 10)
  if (Number.isNaN(service_id)) {
    throw new Error('Invalid service ID')
  }
  return service_id
}

function parseAssigneeId(assigneeId: string): number {
  const assigned_to_id = Number.parseInt(assigneeId, 10)
  if (Number.isNaN(assigned_to_id)) {
    throw new Error('Invalid assignee ID')
  }
  return assigned_to_id
}

function normalizeDescription(description: string): string | null {
  return description.length > 0 ? description : null
}

/** UI priority maps 1:1 to backend severity (same enum values). */
export function mapUiIncidentPriorityToApiSeverity(
  priority: IncidentPriority,
): ApiIncidentSeverity {
  return priority
}

/** Map create form values to POST /incidents body (excludes assignee; no assigned_to_id). */
export function mapCreateIncidentInputToApi(
  input: CreateIncidentInput,
  required: CreateIncidentRequiredApiFields,
): ApiIncidentCreate {
  return {
    title: input.title,
    description: normalizeDescription(input.description),
    status: required.status,
    severity: mapUiIncidentPriorityToApiSeverity(input.priority),
    service_id: parseServiceId(input.affectedServiceId),
    started_at: required.started_at,
  }
}

/** Map resolve action to PATCH /incidents/{id} body. */
export function mapResolveIncidentToUpdate(resolvedAt: string): ApiIncidentUpdate {
  return {
    status: 'resolved',
    resolved_at: resolvedAt,
  }
}

/**
 * Map UI assignee ID to optional PATCH /incidents/{id} body after create.
 * Returns null when assigneeId is undefined (skip assignment PATCH).
 * Returns { assigned_to_id: null } to clear assignment when assigneeId is null/blank.
 */
export function mapAssigneePatch(
  assigneeId: string | null | undefined,
): ApiIncidentUpdate | null {
  if (assigneeId === undefined) {
    return null
  }

  if (assigneeId === null || assigneeId.trim() === '') {
    return { assigned_to_id: null }
  }

  return { assigned_to_id: parseAssigneeId(assigneeId) }
}

/** Map comment form content to POST /incidents/{id}/comments body. */
export function mapIncidentCommentFormToCreateBody(content: string): ApiIncidentCommentCreate {
  return { content }
}

/** Map comment form content to PATCH /incidents/{id}/comments/{comment_id} body. */
export function mapIncidentCommentFormToUpdateBody(content: string): ApiIncidentCommentUpdate {
  return { content }
}

const BACKEND_EVENT_TYPE_MAP: Record<string, IncidentEventType> = {
  status_change: 'status_change',
  assignment: 'assignment',
  resolution: 'resolution',
  comment: 'comment',
  comment_edited: 'comment',
  comment_deleted: 'comment',
  created: 'status_change',
  severity_change: 'escalation',
  alert_linked: 'status_change',
  alert_unlinked: 'status_change',
}

const DEFAULT_EVENT_TYPE: IncidentEventType = 'status_change'

function mapBackendEventType(eventType: string): IncidentEventType {
  return BACKEND_EVENT_TYPE_MAP[eventType] ?? DEFAULT_EVENT_TYPE
}

export function mapApiIncidentToIncident(api: ApiIncident): Incident {
  return mapRecentIncidentToIncident(api)
}

export function mapApiEventToIncidentEvent(api: ApiIncidentEvent): IncidentEvent {
  return {
    id: String(api.id),
    timestamp: api.created_at,
    type: mapBackendEventType(api.event_type),
    message: api.message,
    userId: String(api.author_id),
  }
}

export function mapApiCommentToIncidentComment(api: ApiIncidentComment): IncidentComment {
  return {
    id: String(api.id),
    timestamp: api.created_at,
    userId: String(api.author_id),
    content: api.content,
  }
}
