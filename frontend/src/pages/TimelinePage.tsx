/**
 * Chronological event timeline with type and service filters.
 */

import { useMemo, useState } from 'react'

import { mockServices } from '../data/services.ts'
import { mockTimelineEvents } from '../data/timeline.ts'
import TimelineFilters from '../components/timeline/TimelineFilters.tsx'
import TimelineHeader from '../components/timeline/TimelineHeader.tsx'
import TimelineList from '../components/timeline/TimelineList.tsx'
import TimelineStats from '../components/timeline/TimelineStats.tsx'
import {
  defaultTimelineFilters,
  filterTimelineEvents,
  sortTimelineEvents,
  type TimelineFilters as TimelineFiltersState,
} from '../lib/timeline-stats.ts'

export default function TimelinePage() {
  const [filters, setFilters] = useState<TimelineFiltersState>(defaultTimelineFilters)

  const filteredEvents = useMemo(
    () => sortTimelineEvents(filterTimelineEvents(mockTimelineEvents, filters)),
    [filters],
  )

  return (
    <div className="space-y-6">
      <TimelineHeader />
      <TimelineStats events={mockTimelineEvents} />
      <TimelineFilters filters={filters} services={mockServices} onChange={setFilters} />
      <TimelineList events={filteredEvents} services={mockServices} />
    </div>
  )
}
