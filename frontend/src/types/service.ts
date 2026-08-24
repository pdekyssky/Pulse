/**
 * TypeScript types for services, health checks, and form inputs.
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
  responseTime: number
  team: string
  category: ServiceCategory
  environment: ServiceEnvironment
  lastCheck: string
  ownerId: string
  createdAt: string
  healthChecks: HealthCheck[]
  recentMetrics: ServiceMetric[]
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

export interface ServiceFormInput {
  name: string
  description: string
  ownerId: string
  /** Uptime percentage (0–999.99). Required for create; populated from service on edit when available. */
  uptime?: number
  /** UI-only — not sent to the Services CRUD API */
  status: ServiceStatus
  /** UI-only — not sent to the Services CRUD API */
  category: ServiceCategory
  /** UI-only — not sent to the Services CRUD API */
  environment: ServiceEnvironment
  /** UI-only — not sent to the Services CRUD API */
  team: string
}

/** Backend-backed create fields derived from ServiceFormInput. */
export interface ServiceCreateFormInput {
  name: string
  description: string
  ownerId: string
  uptime: number | string
}

/** Backend-backed update fields for partial PATCH payloads. */
export interface ServiceUpdateFormInput {
  name?: string
  description?: string
  ownerId?: string
  uptime?: number | string
}
