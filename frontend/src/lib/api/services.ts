import type {
  ApiService,
  ApiServiceCreate,
  ApiServiceUpdate,
} from '../../types/api/service.ts'
import { apiRequest } from './client.ts'

export function fetchServices(): Promise<ApiService[]> {
  return apiRequest<ApiService[]>('/services')
}

export function createService(data: ApiServiceCreate): Promise<ApiService> {
  return apiRequest<ApiService>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateService(id: number, data: ApiServiceUpdate): Promise<ApiService> {
  return apiRequest<ApiService>(`/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteService(id: number): Promise<void> {
  return apiRequest<void>(`/services/${id}`, {
    method: 'DELETE',
  })
}
