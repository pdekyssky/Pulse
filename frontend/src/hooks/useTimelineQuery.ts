import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchTimeline } from '../lib/api/timeline.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import {
  mapApiTimelineEventToTimelineEvent,
  mapApiTimelineStatsToTimelineStats,
} from '../lib/mappers/timeline.ts'
import type { TimelineListParams } from '../types/api/timeline.ts'
import type { TimelineEvent } from '../types/timeline.ts'
import type { TimelineStats } from '../lib/timeline-stats.ts'

export interface PaginatedTimelineList {
  items: TimelineEvent[]
  page: number
  page_size: number
  total: number
  total_pages: number
  stats: TimelineStats
}

export function useTimelineList(params: TimelineListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.timeline, params],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PaginatedTimelineList> => {
      const response = await fetchTimeline(params)

      return {
        items: response.items.map(mapApiTimelineEventToTimelineEvent),
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
        stats: mapApiTimelineStatsToTimelineStats(response.stats),
      }
    },
  })
}
