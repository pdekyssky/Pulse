import type {
  ApiDashboardOverview,
  DashboardOverviewStats,
} from '../../types/api/dashboard.ts'
import type { Incident, IncidentPriority, IncidentStatus } from '../../types/incident.ts'

function toPercent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0
}

export function mapDashboardOverviewToStats(
  overview: ApiDashboardOverview,
): DashboardOverviewStats {
  const totalServices = overview.services.total
  const operational = overview.services_by_status.operational ?? 0
  const degraded = overview.services_by_status.degraded ?? 0
  const down = overview.services_by_status.down ?? 0

  return {
    totalServices,
    operational,
    degraded,
    down,
    activeIncidents: overview.incidents.active,
    operationalPercent: toPercent(operational, totalServices),
    degradedPercent: toPercent(degraded, totalServices),
    downPercent: toPercent(down, totalServices),
  }
}

function formatIncidentDuration(startedAt: string, resolvedAt: string | null): string {
  const endMs = resolvedAt ? new Date(resolvedAt).getTime() : Date.now()
  const diffMs = Math.max(0, endMs - new Date(startedAt).getTime())
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function mapRecentIncidentToIncident(
  incident: ApiDashboardOverview['recent_incidents'][number],
): Incident {
  return {
    id: `inc-${incident.id}`,
    title: incident.title,
    description: incident.description ?? '',
    status: incident.status as IncidentStatus,
    priority: incident.severity as IncidentPriority,
    startedAt: incident.started_at,
    duration: formatIncidentDuration(incident.started_at, incident.resolved_at),
    assigneeId: incident.assigned_to_id ? String(incident.assigned_to_id) : '',
    createdById: incident.created_by_id ? String(incident.created_by_id) : '',
    createdAt: incident.created_at,
    updatedAt: incident.updated_at,
    resolvedAt: incident.resolved_at,
    affectedServiceIds: [String(incident.service_id)],
    timeline: [],
    logs: [],
    comments: [],
  }
}

export function getActiveRecentIncidents(overview: ApiDashboardOverview): Incident[] {
  const priorityOrder: Record<IncidentPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return overview.recent_incidents
    .filter((incident) => incident.status !== 'resolved')
    .map(mapRecentIncidentToIncident)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}
