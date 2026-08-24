import type { ApiService, ApiServiceCreate, ApiServiceUpdate } from '../../types/api/service.ts'
import type {
  Service,
  ServiceCreateFormInput,
  ServiceFormInput,
  ServiceStatus,
  ServiceUpdateFormInput,
} from '../../types/service.ts'

export { mapApiUserToTeamUser } from './user.ts'

const STATUS_RESPONSE_TIME_MS: Record<ServiceStatus, number> = {
  operational: 45,
  degraded: 80,
  down: 150,
}

export function mapApiServiceStatus(status: string): ServiceStatus {
  switch (status) {
    case 'operational':
      return 'operational'
    case 'degraded':
      return 'degraded'
    case 'partial_outage':
    case 'major_outage':
      return 'down'
    default:
      return 'degraded'
  }
}

export function mapApiServiceToService(api: ApiService): Service {
  const status = mapApiServiceStatus(api.status)

  return {
    id: String(api.id),
    name: api.name,
    description: api.description ?? '',
    status,
    uptime: Number(api.uptime),
    responseTime: STATUS_RESPONSE_TIME_MS[status],
    team: '—',
    category: 'application',
    environment: 'production',
    lastCheck: api.updated_at,
    ownerId: String(api.owner_id),
    createdAt: api.created_at,
    healthChecks: [],
    recentMetrics: [],
  }
}

function parseOwnerId(ownerId: string): number {
  const owner_id = Number.parseInt(ownerId, 10)
  if (Number.isNaN(owner_id)) {
    throw new Error('Invalid owner ID')
  }
  return owner_id
}

function normalizeDescription(description: string): string | null {
  return description.length > 0 ? description : null
}

/** Map UI form values (plus required uptime) to POST /services body. */
export function mapServiceFormToCreateBody(form: ServiceCreateFormInput): ApiServiceCreate {
  return {
    name: form.name,
    description: normalizeDescription(form.description),
    owner_id: parseOwnerId(form.ownerId),
    uptime: form.uptime,
  }
}

/** Map UI form values to PATCH /services/{id} body (partial; uptime only when changed). */
export function mapServiceFormToUpdateBody(
  form: ServiceUpdateFormInput,
  original?: ServiceUpdateFormInput,
): ApiServiceUpdate {
  const body: ApiServiceUpdate = {}

  if (form.name !== undefined) {
    body.name = form.name
  }
  if (form.description !== undefined) {
    body.description = normalizeDescription(form.description)
  }
  if (form.ownerId !== undefined) {
    body.owner_id = parseOwnerId(form.ownerId)
  }
  if (form.uptime !== undefined) {
    const uptimeChanged = original === undefined || form.uptime !== original.uptime
    if (uptimeChanged) {
      body.uptime = form.uptime
    }
  }

  return body
}

/** Derive backend-backed create fields from ServiceFormDialog output. */
export function toServiceCreateFormInput(form: ServiceFormInput): ServiceCreateFormInput {
  if (form.uptime === undefined || Number.isNaN(form.uptime)) {
    throw new Error('Uptime is required to create a service')
  }

  return {
    name: form.name,
    description: form.description,
    ownerId: form.ownerId,
    uptime: form.uptime,
  }
}

/** Derive backend-backed update fields from ServiceFormDialog output. */
export function toServiceUpdateFormInput(form: ServiceFormInput): ServiceUpdateFormInput {
  const update: ServiceUpdateFormInput = {
    name: form.name,
    description: form.description,
    ownerId: form.ownerId,
  }

  if (form.uptime !== undefined && !Number.isNaN(form.uptime)) {
    update.uptime = form.uptime
  }

  return update
}

/** Map an existing service to backend-backed update form values (includes uptime from API data). */
export function serviceToUpdateFormInput(service: Service): ServiceUpdateFormInput {
  return {
    name: service.name,
    description: service.description,
    ownerId: service.ownerId,
    uptime: service.uptime,
  }
}
