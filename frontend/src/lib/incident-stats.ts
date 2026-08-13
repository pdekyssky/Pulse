/**
 * Incident filtering, sorting, and summary stat computations.
 */

import type {
  Incident,
  IncidentPriority,
  IncidentStatus,
} from '../types/incident.ts'

export interface IncidentStats {
  active: number
  investigating: number
  critical: number
  resolved: number
}

export function computeIncidentStats(incidents: Incident[]): IncidentStats {
  return {
    active: incidents.filter((incident) => incident.status !== 'resolved').length,
    investigating: incidents.filter((incident) => incident.status === 'investigating').length,
    critical: incidents.filter(
      (incident) => incident.priority === 'critical' && incident.status !== 'resolved',
    ).length,
    resolved: incidents.filter((incident) => incident.status === 'resolved').length,
  }
}

export type IncidentFilterStatus = IncidentStatus | 'all'

export type IncidentFilterPriority = IncidentPriority | 'all'

export type IncidentDateFilter = 'all' | '7d' | '30d'

export interface IncidentFilters {
  search: string
  status: IncidentFilterStatus
  priority: IncidentFilterPriority
  serviceId: string
  dateRange: IncidentDateFilter
}

export function filterIncidents(incidents: Incident[], filters: IncidentFilters): Incident[] {
  const search = filters.search.trim().toLowerCase()
  const now = Date.now()

  const dateCutoff: Record<IncidentDateFilter, number | null> = {
    all: null,
    '7d': now - 7 * 24 * 60 * 60 * 1000,
    '30d': now - 30 * 24 * 60 * 60 * 1000,
  }

  const cutoff = dateCutoff[filters.dateRange]

  return incidents.filter((incident) => {
    const matchesSearch =
      search.length === 0 ||
      incident.title.toLowerCase().includes(search) ||
      incident.id.toLowerCase().includes(search)

    const matchesStatus = filters.status === 'all' || incident.status === filters.status
    const matchesPriority = filters.priority === 'all' || incident.priority === filters.priority
    const matchesService =
      filters.serviceId === 'all' ||
      incident.affectedServiceIds.includes(filters.serviceId)

    const matchesDate =
      cutoff === null || new Date(incident.startedAt).getTime() >= cutoff

    return matchesSearch && matchesStatus && matchesPriority && matchesService && matchesDate
  })
}

export function sortIncidents(incidents: Incident[]): Incident[] {
  const priorityOrder: Record<IncidentPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  const statusOrder: Record<IncidentStatus, number> = {
    investigating: 0,
    identified: 1,
    monitoring: 2,
    resolved: 3,
  }

  return [...incidents].sort((a, b) => {
    // Push resolved incidents to the bottom of the list
    if (a.status === 'resolved' && b.status !== 'resolved') {
      return 1
    }
    if (b.status === 'resolved' && a.status !== 'resolved') {
      return -1
    }

    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) {
      return priorityDiff
    }

    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) {
      return statusDiff
    }

    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  })
}
