/**
 * TypeScript types for services and form inputs.
 * Fields match the Express Service model unless marked optional leftover UI fields.
 */

export type ServiceStatus = 'operational' | 'degraded' | 'down'

export type ServiceCategory = 'application' | 'infrastructure' | 'platform'

export type ServiceEnvironment = 'production' | 'staging' | 'development'

export interface HealthCheck {
  id: string
  timestamp: string
  status: ServiceStatus
  message: string
}

export interface ServiceMetric {
  label: string
  value: string
  trend?: 'up' | 'down' | 'stable'
}

export interface Service {
  id: string
  name: string
  description: string
  status: ServiceStatus
  uptime: number
  ownerId: string
  createdAt: string
  updatedAt?: string
  /** Optional leftover fields used by mock/analytics pages; not returned by Express. */
  responseTime?: number
  team?: string
  category?: ServiceCategory
  environment?: ServiceEnvironment
  lastCheck?: string
  healthChecks?: HealthCheck[]
  recentMetrics?: ServiceMetric[]
}

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  application: 'Application',
  infrastructure: 'Infrastructure',
  platform: 'Platform',
}

export const serviceEnvironmentLabels: Record<ServiceEnvironment, string> = {
  production: 'Production',
  staging: 'Staging',
  development: 'Development',
}

/** Backend-backed service form fields. */
export interface ServiceFormInput {
  name: string
  description: string
  ownerId: string
  uptime?: number
  status: ServiceStatus
}

/** Backend-backed create fields derived from ServiceFormInput. */
export interface ServiceCreateFormInput {
  name: string
  description: string
  ownerId: string
  uptime: number | string
  status: ServiceStatus
}

/** Backend-backed update fields for partial PATCH payloads. */
export interface ServiceUpdateFormInput {
  name?: string
  description?: string
  ownerId?: string
  uptime?: number | string
  status?: ServiceStatus
}
