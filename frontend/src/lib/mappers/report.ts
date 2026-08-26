import type {
  ApiIncidentReportRow,
  ApiIncidentReportStats,
  IncidentReportListParams,
} from '../../types/api/report.ts'
import type { IncidentPriority, IncidentStatus } from '../../types/incident.ts'
import type { IncidentReportFilters, IncidentReportStats } from '../report-stats.ts'

export interface IncidentReportRow {
  id: number
  title: string
  severity: IncidentPriority
  status: IncidentStatus
  serviceId: number | null
  serviceName: string | null
  assignedToId: number | null
  assignedToName: string | null
  createdAt: string
  resolvedAt: string | null
}

export function mapApiIncidentReportRow(api: ApiIncidentReportRow): IncidentReportRow {
  return {
    id: api.id,
    title: api.title,
    severity: api.severity as IncidentPriority,
    status: api.status as IncidentStatus,
    serviceId: api.service_id,
    serviceName: api.service_name,
    assignedToId: api.assigned_to_id,
    assignedToName: api.assigned_to_name,
    createdAt: api.created_at,
    resolvedAt: api.resolved_at,
  }
}

export function mapApiIncidentReportStats(api: ApiIncidentReportStats): IncidentReportStats {
  return {
    total: api.total,
    open: api.open,
    resolved: api.resolved,
  }
}

export function buildIncidentReportListParams(
  filters: IncidentReportFilters,
  page: number,
  pageSize: number,
): IncidentReportListParams {
  const params: IncidentReportListParams = {
    page,
    page_size: pageSize,
  }

  const search = filters.search.trim()
  if (search.length > 0) {
    params.search = search
  }
  if (filters.severity !== 'all') {
    params.severity = filters.severity
  }
  if (filters.status !== 'all') {
    params.status = filters.status
  }
  if (filters.serviceId !== 'all') {
    const service_id = Number.parseInt(filters.serviceId, 10)
    if (!Number.isNaN(service_id)) {
      params.service_id = service_id
    }
  }
  if (filters.period !== 'all') {
    params.period = filters.period
  }

  return params
}
