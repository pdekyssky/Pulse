/**
 * Service ID generation and mock create/update/form mapping helpers.
 */

import type { Service, ServiceFormInput } from '../types/service.ts'

export function createServiceId(existing: Service[]): string {
  const numbers = existing
    .map((service) => Number.parseInt(service.id.replace(/^svc-/i, ''), 10))
    .filter((value) => !Number.isNaN(value))

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  return `svc-${String(next).padStart(3, '0')}`
}

export function createServiceFromInput(input: ServiceFormInput, existing: Service[]): Service {
  const now = new Date().toISOString()
  const uptime = input.uptime !== undefined && !Number.isNaN(input.uptime) ? input.uptime : 100

  return {
    id: createServiceId(existing),
    name: input.name,
    description: input.description,
    status: input.status,
    uptime,
    responseTime: 0,
    team: input.team,
    category: input.category,
    environment: input.environment,
    lastCheck: now,
    ownerId: input.ownerId,
    createdAt: now,
    healthChecks: [
      {
        id: `hc-new-${Date.now()}`,
        timestamp: now,
        status: input.status,
        message: 'Initial health check passed.',
      },
    ],
    recentMetrics: [
      { label: 'Requests/min', value: '0', trend: 'stable' },
      { label: 'Error rate', value: '0%', trend: 'stable' },
    ],
  }
}

export function updateServiceFromInput(service: Service, input: ServiceFormInput): Service {
  return {
    ...service,
    name: input.name,
    description: input.description,
    status: input.status,
    team: input.team,
    category: input.category,
    environment: input.environment,
    ownerId: input.ownerId,
    uptime:
      input.uptime !== undefined && !Number.isNaN(input.uptime) ? input.uptime : service.uptime,
    lastCheck: new Date().toISOString(),
  }
}

export function serviceToFormInput(service: Service): ServiceFormInput {
  return {
    name: service.name,
    description: service.description,
    ownerId: service.ownerId,
    uptime: Number.isFinite(service.uptime) ? service.uptime : undefined,
    status: service.status,
    category: service.category,
    environment: service.environment,
    team: service.team,
  }
}
