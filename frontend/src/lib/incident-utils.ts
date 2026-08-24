/**
 * Incident creation helpers and timeline/log append logic for mock CRUD.
 */

import type {
  CreateIncidentInput,
  Incident,
  IncidentEvent,
  IncidentStatus,
} from '../types/incident.ts'

export function parseIncidentNumericId(id: string): number | null {
  const parsed = Number.parseInt(id.replace(/^inc-/i, ''), 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function createIncidentId(existing: Incident[]): string {
  // Parse numeric suffix from existing IDs (e.g. "inc-003" → 3)
  const numbers = existing
    .map((incident) => Number.parseInt(incident.id.replace(/^inc-/i, ''), 10))
    .filter((value) => !Number.isNaN(value))

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  return `inc-${String(next).padStart(3, '0')}`
}

export function buildInitialTimeline(
  incidentId: string,
  assigneeName: string,
  assigneeId: string,
  startedAt: string,
): IncidentEvent[] {
  const base = new Date(startedAt).getTime()

  // Synthetic back-dated events so new incidents have a realistic timeline
  return [
    {
      id: `evt-${incidentId}-1`,
      timestamp: new Date(base).toISOString(),
      type: 'status_change',
      message: 'Incident detected.',
      userId: 'user-3',
    },
    {
      id: `evt-${incidentId}-2`,
      timestamp: new Date(base + 60_000).toISOString(),
      type: 'status_change',
      message: 'Incident created.',
      userId: assigneeId,
    },
    {
      id: `evt-${incidentId}-3`,
      timestamp: new Date(base + 120_000).toISOString(),
      type: 'assignment',
      message: `Assigned to ${assigneeName}.`,
      userId: assigneeId,
    },
    {
      id: `evt-${incidentId}-4`,
      timestamp: new Date(base + 300_000).toISOString(),
      type: 'status_change',
      message: 'Investigation started.',
      userId: assigneeId,
    },
  ]
}

export function createIncidentFromInput(
  input: CreateIncidentInput,
  existing: Incident[],
  assigneeName: string,
): Incident {
  const id = createIncidentId(existing)
  const startedAt = new Date().toISOString()

  return {
    id,
    title: input.title,
    description: input.description,
    status: 'investigating',
    priority: input.priority,
    startedAt,
    duration: '0m',
    assigneeId: input.assigneeId,
    affectedServiceIds: [input.affectedServiceId],
    timeline: buildInitialTimeline(id, assigneeName, input.assigneeId, startedAt),
    logs: [
      {
        id: `log-${id}-1`,
        timestamp: startedAt,
        level: 'warn',
        message: `Incident ${id.toUpperCase()} opened for ${input.title}.`,
      },
    ],
    comments: [],
  }
}

export function appendStatusChange(
  incident: Incident,
  status: IncidentStatus,
  message: string,
  userId: string,
): Incident {
  const event: IncidentEvent = {
    id: `evt-${incident.id}-${incident.timeline.length + 1}`,
    timestamp: new Date().toISOString(),
    type: status === 'resolved' ? 'resolution' : 'status_change',
    message,
    userId,
  }

  return {
    ...incident,
    status,
    timeline: [...incident.timeline, event],
    logs: [
      ...incident.logs,
      {
        id: `log-${incident.id}-${incident.logs.length + 1}`,
        timestamp: event.timestamp,
        level: status === 'resolved' ? 'info' : 'warn',
        message,
      },
    ],
  }
}
