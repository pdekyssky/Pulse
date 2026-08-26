/**
 * Incident summary stat computations and list filter state.
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

export interface IncidentFilters {
  search: string
  status: IncidentFilterStatus
  priority: IncidentFilterPriority
  serviceId: string
}

export const defaultIncidentFilters: IncidentFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  serviceId: 'all',
}
