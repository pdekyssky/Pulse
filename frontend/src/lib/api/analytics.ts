import type {
  AnalyticsOverviewParams,
  ApiAnalyticsOverviewResponse,
} from '../../types/api/analytics.ts'
import { apiRequest } from './client.ts'

function buildAnalyticsQuery(params: AnalyticsOverviewParams = {}): string {
  const searchParams = new URLSearchParams()

  if (params.date_range !== undefined) {
    searchParams.set('date_range', params.date_range)
  }
  if (params.service_id !== undefined) {
    searchParams.set('service_id', String(params.service_id))
  }

  const query = searchParams.toString()
  return query.length > 0 ? `?${query}` : ''
}

export function fetchAnalyticsOverview(
  params: AnalyticsOverviewParams = {},
): Promise<ApiAnalyticsOverviewResponse> {
  return apiRequest<ApiAnalyticsOverviewResponse>(`/analytics/overview${buildAnalyticsQuery(params)}`)
}
