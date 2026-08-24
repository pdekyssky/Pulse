import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  acknowledgeAlert,
  createAlert,
  fetchAlerts,
  resolveAlert,
} from '../lib/api/alerts.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import { mapApiAlertToAlert } from '../lib/mappers/alert.ts'
import type { AlertListParams, ApiAlertCreate } from '../types/api/alert.ts'
import type { Alert } from '../types/alert.ts'

export interface PaginatedAlertList {
  items: Alert[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export function useAlertsList(params: AlertListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.alerts, params],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PaginatedAlertList> => {
      const response = await fetchAlerts(params)

      return {
        items: response.items.map(mapApiAlertToAlert),
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
      }
    },
  })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApiAlertCreate): Promise<Alert> => {
      const alert = await createAlert(data)
      return mapApiAlertToAlert(alert)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts })
    },
  })
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<Alert> => {
      const alert = await acknowledgeAlert(id)
      return mapApiAlertToAlert(alert)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts })
    },
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<Alert> => {
      const alert = await resolveAlert(id)
      return mapApiAlertToAlert(alert)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts })
    },
  })
}
