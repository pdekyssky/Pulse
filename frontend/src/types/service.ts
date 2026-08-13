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
  status: ServiceStatus
  category: ServiceCategory
  environment: ServiceEnvironment
  team: string
  ownerId: string
}
