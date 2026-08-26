/**
 * Combine real incident, event, and comment records into a chronological timeline.
 * Does not invent mutation history that was never stored.
 */

import type { Incident, IncidentComment, IncidentEvent } from '../types/incident.ts'

export type IncidentTimelineItem =
  | {
      kind: 'created'
      id: string
      timestamp: string
      userId?: string
      message: string
    }
  | {
      kind: 'event'
      id: string
      timestamp: string
      event: IncidentEvent
    }
  | {
      kind: 'comment'
      id: string
      timestamp: string
      comment: IncidentComment
    }

function timestampMs(value: string): number {
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

const kindOrder: Record<IncidentTimelineItem['kind'], number> = {
  created: 0,
  event: 1,
  comment: 2,
}

export function buildIncidentTimelineItems(
  incident: Incident,
  events: IncidentEvent[],
  comments: IncidentComment[],
): IncidentTimelineItem[] {
  const createdAt = incident.createdAt ?? incident.startedAt
  const items: IncidentTimelineItem[] = [
    {
      kind: 'created',
      id: `created-${incident.id}`,
      timestamp: createdAt,
      userId: incident.createdById,
      message: 'Incident created.',
    },
  ]

  for (const event of events) {
    items.push({
      kind: 'event',
      id: `event-${event.id}`,
      timestamp: event.timestamp,
      event,
    })
  }

  for (const comment of comments) {
    items.push({
      kind: 'comment',
      id: `comment-${comment.id}`,
      timestamp: comment.timestamp,
      comment,
    })
  }

  return items.sort((a, b) => {
    const timeDiff = timestampMs(a.timestamp) - timestampMs(b.timestamp)
    if (timeDiff !== 0) {
      return timeDiff
    }

    return kindOrder[a.kind] - kindOrder[b.kind]
  })
}
