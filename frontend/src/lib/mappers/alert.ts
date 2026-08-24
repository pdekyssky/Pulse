import type {
  AlertListParams,
  ApiAlert,
  ApiAlertCreate,
  ApiAlertSeverity,
  ApiAlertStatus,
} from '../../types/api/alert.ts'
import type { AlertFilters } from '../alert-stats.ts'
import type { Alert, AlertCreateFormInput, AlertSeverity, AlertStatus } from '../../types/alert.ts'

/**
 * Backend → UI status mapping.
 * Backend `new` represents an unacknowledged alert; UI labels this `active`.
 */
export function mapApiAlertStatus(status: string): AlertStatus {
  switch (status) {
    case 'new':
      return 'active'
    case 'acknowledged':
      return 'acknowledged'
    case 'resolved':
      return 'resolved'
    default:
      return 'active'
  }
}

/**
 * UI filter → backend status.
 * UI `active` maps to backend `new` only (not acknowledged/unresolved).
 */
export function mapUiAlertStatusFilterToApi(status: AlertStatus): ApiAlertStatus {
  switch (status) {
    case 'active':
      return 'new'
    case 'acknowledged':
      return 'acknowledged'
    case 'resolved':
      return 'resolved'
  }
}

/**
 * Backend → UI severity mapping (4 backend values → 3 UI values).
 * - critical → critical
 * - high, medium → warning
 * - low → info
 */
export function mapApiAlertSeverity(severity: string): AlertSeverity {
  switch (severity) {
    case 'critical':
      return 'critical'
    case 'high':
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'warning'
  }
}

/**
 * UI severity filter → backend severity.
 * Limitation: UI `warning` filters backend `high` only; `medium` alerts remain
 * visible under "All Severities" but not under the Warning filter.
 * - critical → critical
 * - warning → high
 * - info → low
 */
export function mapUiAlertSeverityFilterToApi(severity: AlertSeverity): ApiAlertSeverity {
  switch (severity) {
    case 'critical':
      return 'critical'
    case 'warning':
      return 'high'
    case 'info':
      return 'low'
  }
}

export function mapApiAlertToAlert(api: ApiAlert): Alert {
  return {
    id: String(api.id),
    title: api.name,
    message: api.description ?? '',
    severity: mapApiAlertSeverity(api.severity),
    status: mapApiAlertStatus(api.status),
    serviceId: String(api.service_id),
    incidentId: api.incident_id !== null ? String(api.incident_id) : null,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  }
}

export function buildAlertListParams(
  filters: AlertFilters,
  page: number,
  pageSize: number,
): AlertListParams {
  const params: AlertListParams = {
    page,
    page_size: pageSize,
  }

  const search = filters.search.trim()
  if (search.length > 0) {
    params.search = search
  }
  if (filters.status !== 'all') {
    params.status = mapUiAlertStatusFilterToApi(filters.status)
  }
  if (filters.severity !== 'all') {
    params.severity = mapUiAlertSeverityFilterToApi(filters.severity)
  }
  if (filters.serviceId !== 'all') {
    const service_id = Number.parseInt(filters.serviceId, 10)
    if (!Number.isNaN(service_id)) {
      params.service_id = service_id
    }
  }

  return params
}

function parseServiceId(serviceId: string): number {
  const service_id = Number.parseInt(serviceId, 10)
  if (Number.isNaN(service_id)) {
    throw new Error('Invalid service ID')
  }
  return service_id
}

function normalizeDescription(description: string): string | null {
  return description.length > 0 ? description : null
}

/** Map create form values to POST /alerts body (backend field names only). */
export function mapAlertFormToCreateBody(form: AlertCreateFormInput): ApiAlertCreate {
  return {
    name: form.name,
    description: normalizeDescription(form.description),
    severity: form.severity,
    service_id: parseServiceId(form.serviceId),
  }
}

/** Whether the UI can offer Acknowledge (backend status must be `new`). */
export function canAcknowledgeAlert(alert: Alert): boolean {
  return alert.status === 'active'
}

/** Whether the UI can offer Resolve (backend status must be `acknowledged`). */
export function canResolveAlert(alert: Alert): boolean {
  return alert.status === 'acknowledged'
}
