import type { ApiService, ApiServiceCreate, ApiServiceUpdate } from '../../types/api/service.ts'
import type {
  Service,
  ServiceCreateFormInput,
  ServiceFormInput,
  ServiceStatus,
  ServiceUpdateFormInput,
} from '../../types/service.ts'

export { mapApiUserToTeamUser } from './user.ts'

export function mapApiServiceStatus(status: string): ServiceStatus {
  switch (status) {
    case 'operational':
      return 'operational'
    case 'degraded':
      return 'degraded'
    case 'down':
      return 'down'
    default:
      return 'degraded'
  }
}

export function mapApiServiceToService(api: ApiService): Service {
  return {
    id: String(api.id),
    name: api.name,
    description: api.description ?? '',
    status: mapApiServiceStatus(api.status),
    uptime: Number(api.uptime),
    ownerId: api.owner_id != null ? String(api.owner_id) : '',
    createdAt: api.created_at,
    updatedAt: api.updated_at,
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

/** Map UI form values to POST /services body. */
export function mapServiceFormToCreateBody(form: ServiceCreateFormInput): ApiServiceCreate {
  return {
    name: form.name,
    description: normalizeDescription(form.description),
    status: form.status,
    owner_id: parseOwnerId(form.ownerId),
    uptime: form.uptime,
  }
}

/** Map UI form values to PATCH /services/{id} body. */
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
  if (form.status !== undefined && form.status !== original?.status) {
    body.status = form.status
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
    status: form.status,
  }
}

/** Derive backend-backed update fields from ServiceFormDialog output. */
export function toServiceUpdateFormInput(form: ServiceFormInput): ServiceUpdateFormInput {
  const update: ServiceUpdateFormInput = {
    name: form.name,
    description: form.description,
    ownerId: form.ownerId,
    status: form.status,
  }

  if (form.uptime !== undefined && !Number.isNaN(form.uptime)) {
    update.uptime = form.uptime
  }

  return update
}

/** Map an existing service to backend-backed update form values. */
export function serviceToUpdateFormInput(service: Service): ServiceUpdateFormInput {
  return {
    name: service.name,
    description: service.description,
    ownerId: service.ownerId,
    uptime: service.uptime,
    status: service.status,
  }
}
