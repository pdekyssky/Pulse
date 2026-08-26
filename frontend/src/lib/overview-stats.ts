/**
 * Shared service-status labels used by dashboard and service UI.
 */

import type { ServiceStatus } from '../types/service.ts'

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
}
