/**
 * Overview dashboard KPI and active-incident calculations.
 */

import type { Incident } from '../types/incident.ts'
import type { Service, ServiceStatus } from '../types/service.ts'

import { mockIncidents } from '../data/incidents.ts'
import { mockServices } from '../data/services.ts'

export interface OverviewStats {
  totalServices: number
  operational: number
  degraded: number
  down: number
  activeIncidents: number
  operationalPercent: number
  degradedPercent: number
  downPercent: number
}

export function computeOverviewStats(
  services: Service[] = mockServices,
  incidents: Incident[] = mockIncidents,
): OverviewStats {
  const totalServices = services.length
  const operational = services.filter((service) => service.status === 'operational').length
  const degraded = services.filter((service) => service.status === 'degraded').length
  const down = services.filter((service) => service.status === 'down').length
  const activeIncidents = incidents.filter((incident) => incident.status !== 'resolved').length

  const toPercent = (count: number) =>
    totalServices > 0 ? Math.round((count / totalServices) * 1000) / 10 : 0

  return {
    totalServices,
    operational,
    degraded,
    down,
    activeIncidents,
    operationalPercent: toPercent(operational),
    degradedPercent: toPercent(degraded),
    downPercent: toPercent(down),
  }
}

export function getActiveIncidents(incidents: Incident[] = mockIncidents): Incident[] {
  const priorityOrder: Record<Incident['priority'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return incidents
    .filter((incident) => incident.status !== 'resolved')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]) // Critical first
}

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
}
