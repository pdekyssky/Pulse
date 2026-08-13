/**
 * Alert summary stats, filtering, and sorting utilities.
 */

import type { Alert, AlertSeverity, AlertStatus } from '../types/alert.ts'

export interface AlertStats {
  active: number
  critical: number
  acknowledged: number
  resolved: number
}

export function computeAlertStats(alerts: Alert[]): AlertStats {
  return {
    active: alerts.filter((alert) => alert.status === 'active').length,
    critical: alerts.filter((alert) => alert.severity === 'critical').length,
    acknowledged: alerts.filter((alert) => alert.status === 'acknowledged').length,
    resolved: alerts.filter((alert) => alert.status === 'resolved').length,
  }
}

export type AlertFilterSeverity = AlertSeverity | 'all'

export type AlertFilterStatus = AlertStatus | 'all'

export interface AlertFilters {
  search: string
  severity: AlertFilterSeverity
  status: AlertFilterStatus
  serviceId: string
}

export const defaultAlertFilters: AlertFilters = {
  search: '',
  severity: 'all',
  status: 'all',
  serviceId: 'all',
}

export function filterAlerts(alerts: Alert[], filters: AlertFilters): Alert[] {
  const search = filters.search.trim().toLowerCase()

  return alerts.filter((alert) => {
    const matchesSearch =
      search.length === 0 ||
      alert.title.toLowerCase().includes(search) ||
      alert.message.toLowerCase().includes(search)

    const matchesSeverity = filters.severity === 'all' || alert.severity === filters.severity
    const matchesStatus = filters.status === 'all' || alert.status === filters.status
    const matchesService =
      filters.serviceId === 'all' || alert.serviceId === filters.serviceId

    return matchesSearch && matchesSeverity && matchesStatus && matchesService
  })
}

export function sortAlerts(alerts: Alert[]): Alert[] {
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  }

  const statusOrder: Record<AlertStatus, number> = {
    active: 0,
    acknowledged: 1,
    resolved: 2,
  }

  return [...alerts].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) {
      return statusDiff
    }

    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) {
      return severityDiff
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
