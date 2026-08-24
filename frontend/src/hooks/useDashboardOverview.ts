import { useQuery } from '@tanstack/react-query'

import { fetchDashboardOverview } from '../lib/api/dashboard.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import {
  getActiveRecentIncidents,
  mapDashboardOverviewToStats,
} from '../lib/mappers/dashboard.ts'

export { useTeamUsers } from './useTeamQuery.ts'

export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboardOverview,
    queryFn: fetchDashboardOverview,
    select: (overview) => ({
      stats: mapDashboardOverviewToStats(overview),
      activeIncidents: getActiveRecentIncidents(overview),
    }),
  })
}
