import type { ApiReport, PaginatedReports, ReportListParams } from '../../types/api/report.ts'
import { apiRequest } from './client.ts'

function buildReportsQuery(params: ReportListParams = {}): string {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page))
  }
  if (params.page_size !== undefined) {
    searchParams.set('page_size', String(params.page_size))
  }
  if (params.search !== undefined && params.search.length > 0) {
    searchParams.set('search', params.search)
  }
  if (params.type !== undefined) {
    searchParams.set('type', params.type)
  }
  if (params.status !== undefined) {
    searchParams.set('status', params.status)
  }
  if (params.period !== undefined) {
    searchParams.set('period', params.period)
  }

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function fetchReports(params: ReportListParams = {}): Promise<PaginatedReports> {
  return apiRequest<PaginatedReports>(`/reports${buildReportsQuery(params)}`)
}

export function fetchReport(id: string): Promise<ApiReport> {
  return apiRequest<ApiReport>(`/reports/${encodeURIComponent(id)}`)
}
