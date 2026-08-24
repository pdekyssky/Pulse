import type { ApiDashboardOverview } from '../../types/api/dashboard.ts'
import { apiRequest } from './client.ts'

export function fetchDashboardOverview(): Promise<ApiDashboardOverview> {
  return apiRequest<ApiDashboardOverview>('/dashboard/overview')
}
