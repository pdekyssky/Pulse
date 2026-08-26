import type {
  ApiIncident,
  ApiIncidentComment,
  ApiIncidentCommentCreate,
  ApiIncidentCommentUpdate,
  ApiIncidentCreate,
  ApiIncidentEvent,
  ApiIncidentEventCreate,
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

/** Map create form values to POST /incidents body. */
export function mapCreateIncidentInputToApi(input: CreateIncidentInput): ApiIncidentCreate {
  return {
    title: input.title,
    description: normalizeDescription(input.description),
    severity: mapUiIncidentPriorityToApiSeverity(input.priority),
    service_id: parseServiceId(input.affectedServiceId),
  }
}

/** Map resolve action to PATCH /incidents/{id} body. */
export function mapResolveIncidentToUpdate(): ApiIncidentUpdate {
  return {
    status: 'resolved',
  }
}

/**
 * Map UI assignee ID to optional PATCH /incidents/{id} body.
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

export function mapIncidentEventFormToCreateBody(
  eventType: string,
  message: string,
): ApiIncidentEventCreate {
  return {
    event_type: eventType,
    message,
  }
}

const BACKEND_EVENT_TYPE_MAP: Record<string, IncidentEventType> = {
  note: 'note',
  status_change: 'status_change',
  assignment: 'assignment',
  resolution: 'resolution',
  comment: 'comment',
  comment_edited: 'comment',
  comment_deleted: 'comment',
  created: 'status_change',
  severity_change: 'escalation',
  escalation: 'escalation',
  alert_linked: 'status_change',
  alert_unlinked: 'status_change',
}

const DEFAULT_EVENT_TYPE: IncidentEventType = 'note'

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
    sourceType: api.event_type,
    message: api.message,
    userId: String(api.author_id),
  }
}

/** Map edit form values to PATCH /incidents/{id} body. */
export function mapEditIncidentToUpdate(input: {
  title: string
  description: string
}): ApiIncidentUpdate {
  return {
    title: input.title,
    description: normalizeDescription(input.description),
  }
}

export function mapApiCommentToIncidentComment(api: ApiIncidentComment): IncidentComment {
  return {
    id: String(api.id),
    timestamp: api.created_at,
    updatedAt: api.updated_at,
    userId: String(api.author_id),
    content: api.content,
  }
}
