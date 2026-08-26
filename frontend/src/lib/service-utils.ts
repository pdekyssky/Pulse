/**
 * Service form mapping helpers for the Services page.
 */

import type { Service, ServiceFormInput } from '../types/service.ts'

export function parseServiceNumericId(id: string): number | null {
  const parsed = Number.parseInt(id, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function serviceToFormInput(service: Service): ServiceFormInput {
  return {
    name: service.name,
    description: service.description,
    ownerId: service.ownerId,
    uptime: Number.isFinite(service.uptime) ? service.uptime : undefined,
    status: service.status,
  }
}
