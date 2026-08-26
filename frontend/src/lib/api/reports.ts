import type {
  IncidentReportListParams,
  PaginatedIncidentReports,
} from '../../types/api/report.ts'
import { apiRequest } from './client.ts'

function buildIncidentReportsQuery(params: IncidentReportListParams = {}): string {
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
  if (params.severity !== undefined) {
    searchParams.set('severity', params.severity)
  }
  if (params.status !== undefined) {
    searchParams.set('status', params.status)
  }
  if (params.service_id !== undefined) {
    searchParams.set('service_id', String(params.service_id))
  }
  if (params.period !== undefined && params.period !== 'all') {
    searchParams.set('period', params.period)
  }

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function fetchIncidentReports(
  params: IncidentReportListParams = {},
): Promise<PaginatedIncidentReports> {
  return apiRequest<PaginatedIncidentReports>(
    `/reports/incidents${buildIncidentReportsQuery(params)}`,
  )
}
