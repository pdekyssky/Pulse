import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from '../lib/api/services.ts'
import { queryKeys } from '../lib/api/query-keys.ts'
import { mapApiServiceToService } from '../lib/mappers/service.ts'
import type { ApiServiceCreate, ApiServiceUpdate } from '../types/api/service.ts'
import type { Service } from '../types/service.ts'

export function useServices() {
  return useQuery({
    queryKey: queryKeys.services,
    queryFn: async () => {
      const services = await fetchServices()
      return services.map(mapApiServiceToService)
    },
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApiServiceCreate): Promise<Service> => {
      const service = await createService(data)
      return mapApiServiceToService(service)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview })
    },
  })
}

export interface UpdateServiceVariables {
  id: number
  data: ApiServiceUpdate
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateServiceVariables): Promise<Service> => {
      const service = await updateService(id, data)
      return mapApiServiceToService(service)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview })
    },
  })
}
