import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchIncidentReports } from '../lib/api/reports.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import {
  mapApiIncidentReportRow,
  mapApiIncidentReportStats,
  type IncidentReportRow,
} from '../lib/mappers/report.ts'
import type { IncidentReportListParams } from '../types/api/report.ts'
import type { IncidentReportStats } from '../lib/report-stats.ts'

export interface PaginatedIncidentReportList {
  items: IncidentReportRow[]
  page: number
  page_size: number
  total: number
  total_pages: number
  stats: IncidentReportStats
}

export function useIncidentReportsList(params: IncidentReportListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.reports, 'incidents', params],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PaginatedIncidentReportList> => {
      const response = await fetchIncidentReports(params)

      return {
        items: response.items.map(mapApiIncidentReportRow),
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
        stats: mapApiIncidentReportStats(response.stats),
      }
    },
  })
}
