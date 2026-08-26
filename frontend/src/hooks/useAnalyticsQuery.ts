import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchAnalyticsOverview } from '../lib/api/analytics.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import { mapApiAnalyticsOverview } from '../lib/mappers/analytics.ts'
import type { AnalyticsOverview } from '../types/analytics.ts'
import type { AnalyticsOverviewParams } from '../types/api/analytics.ts'

export function useAnalyticsOverview(params: AnalyticsOverviewParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.analytics, params],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<AnalyticsOverview> => {
      const response = await fetchAnalyticsOverview(params)
      return mapApiAnalyticsOverview(response)
    },
  })
}
