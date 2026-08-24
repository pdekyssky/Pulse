/**
 * Vertical list of timeline events grouped by date.
 */

import type { Service } from '../../types/service.ts'
import type { TimelineEvent } from '../../types/timeline.ts'
import Card from '../ui/Card.tsx'
import TimelineItem from './TimelineItem.tsx'
import { groupTimelineEventsByDate } from '../../lib/timeline-stats.ts'

interface TimelineListProps {
  events: TimelineEvent[]
  totalCount: number
  services: Service[]
}

export default function TimelineList({ events, totalCount, services }: TimelineListProps) {
  const getServiceById = (id?: string) =>
    id ? services.find((service) => service.id === id) : undefined

  const groupedEvents = groupTimelineEventsByDate(events)
  const hasNoEvents = totalCount === 0
  const hasNoMatches = !hasNoEvents && events.length === 0

  if (events.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="text-sm text-gray-500">
          {hasNoEvents
            ? 'No timeline events have been recorded yet.'
            : hasNoMatches
              ? 'No timeline events match your filters.'
              : 'No timeline events on this page.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {groupedEvents.map((group) => (
        <section key={group.date}>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-500">
              {group.events.length} event{group.events.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="pl-1">
            {group.events.map((event, index) => (
              <TimelineItem
                key={event.id}
                event={event}
                service={getServiceById(event.serviceId)}
                isLast={index === group.events.length - 1}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
