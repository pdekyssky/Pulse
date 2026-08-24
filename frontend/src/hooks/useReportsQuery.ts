import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchReports } from '../lib/api/reports.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import {
  mapApiReportStatsToReportStats,
  mapApiReportToReport,
} from '../lib/mappers/report.ts'
import type { ReportListParams } from '../types/api/report.ts'
import type { Report } from '../types/report.ts'
import type { ReportStatsSummary } from '../lib/report-stats.ts'

export interface PaginatedReportList {
  items: Report[]
  page: number
  page_size: number
  total: number
  total_pages: number
  stats: ReportStatsSummary
}

export function useReportsList(params: ReportListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.reports, params],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PaginatedReportList> => {
      const response = await fetchReports(params)

      return {
        items: response.items.map(mapApiReportToReport),
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
        stats: mapApiReportStatsToReportStats(response.stats),
      }
    },
  })
}
