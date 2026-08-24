/**
 * Chronological event timeline with API-backed read-only list and filters.
 */

import { useMemo, useState } from 'react'

import QueryState from '../components/common/QueryState.tsx'
import TimelineFilters from '../components/timeline/TimelineFilters.tsx'
import TimelineHeader from '../components/timeline/TimelineHeader.tsx'
import TimelineList from '../components/timeline/TimelineList.tsx'
import TimelinePagination from '../components/timeline/TimelinePagination.tsx'
import TimelineStats from '../components/timeline/TimelineStats.tsx'
import { useTimelineList } from '../hooks/useTimelineQuery.ts'
import { useServices } from '../hooks/useServices.ts'
import {
  defaultTimelineFilters,
  type TimelineFilters as TimelineFiltersState,
} from '../lib/timeline-stats.ts'
import { buildTimelineListParams } from '../lib/mappers/timeline.ts'

export default function TimelinePage() {
  const [filters, setFilters] = useState<TimelineFiltersState>(defaultTimelineFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)

  const listParams = useMemo(
    () => buildTimelineListParams(filters, page, pageSize),
    [filters, page, pageSize],
  )

  const {
    data: timelineData,
    isLoading: isTimelineLoading,
    error: timelineError,
  } = useTimelineList(listParams)
  const { data: services = [], isLoading: isServicesLoading, error: servicesError } = useServices()

  const events = timelineData?.items ?? []
  const stats = timelineData?.stats ?? {
    eventsToday: 0,
    incidents: 0,
    alerts: 0,
    serviceEvents: 0,
  }

  const handleFiltersChange = (nextFilters: TimelineFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const isLoading =
    (isServicesLoading && services.length === 0) ||
    (isTimelineLoading && timelineData === undefined)
  const error = timelineError ?? servicesError

  return (
    <QueryState isLoading={isLoading} error={error} loadingMessage="Loading timeline...">
      <div className="space-y-6">
        <TimelineHeader />
        <TimelineStats stats={stats} />
        <TimelineFilters filters={filters} services={services} onChange={handleFiltersChange} />
        <TimelineList
          events={events}
          totalCount={timelineData?.total ?? 0}
          services={services}
        />
        <TimelinePagination
          page={timelineData?.page ?? page}
          totalPages={timelineData?.total_pages ?? 0}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setPage((current) =>
              timelineData?.total_pages
                ? Math.min(timelineData.total_pages, current + 1)
                : current,
            )
          }
        />
      </div>
    </QueryState>
  )
}
