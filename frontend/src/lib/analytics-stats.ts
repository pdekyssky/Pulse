/**
 * Analytics filter defaults.
 */

import type { AnalyticsFilters } from '../types/analytics.ts'

export const defaultAnalyticsFilters: AnalyticsFilters = {
  dateRange: '7d',
  serviceId: 'all',
}

export function downloadAnalyticsJson(payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pulse-analytics-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
