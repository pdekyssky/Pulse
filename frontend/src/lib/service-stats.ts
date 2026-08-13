/**
 * Service health stats and list filtering logic.
 */

import type { Service, ServiceCategory, ServiceStatus } from '../types/service.ts'

export function computeServiceStats(services: Service[]): {
  totalServices: number
  operational: number
  degraded: number
  down: number
  operationalPercent: number
  degradedPercent: number
  downPercent: number
} {
  const totalServices = services.length
  const operational = services.filter((service) => service.status === 'operational').length
  const degraded = services.filter((service) => service.status === 'degraded').length
  const down = services.filter((service) => service.status === 'down').length

  const toPercent = (count: number) =>
    totalServices > 0 ? Math.round((count / totalServices) * 1000) / 10 : 0

  return {
    totalServices,
    operational,
    degraded,
    down,
    operationalPercent: toPercent(operational),
    degradedPercent: toPercent(degraded),
    downPercent: toPercent(down),
  }
}

export type ServiceFilterStatus = ServiceStatus | 'all'

export type ServiceFilterCategory = ServiceCategory | 'all'

export interface ServiceFilters {
  search: string
  status: ServiceFilterStatus
  category: ServiceFilterCategory
}

export const defaultServiceFilters: ServiceFilters = {
  search: '',
  status: 'all',
  category: 'all',
}

export function filterServices(services: Service[], filters: ServiceFilters): Service[] {
  const search = filters.search.trim().toLowerCase()

  return services.filter((service) => {
    const matchesSearch =
      search.length === 0 ||
      service.name.toLowerCase().includes(search) ||
      service.description.toLowerCase().includes(search) ||
      service.team.toLowerCase().includes(search)

    const matchesStatus = filters.status === 'all' || service.status === filters.status
    const matchesCategory = filters.category === 'all' || service.category === filters.category

    return matchesSearch && matchesStatus && matchesCategory
  })
}
