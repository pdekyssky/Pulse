/**
 * Colored badge for service operational status.
 */

import type { ServiceStatus } from '../../types/service.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import { serviceStatusLabels } from '../../lib/overview-stats.ts'

interface ServiceStatusBadgeProps {
  status: ServiceStatus
  className?: string
}

export default function ServiceStatusBadge({ status, className }: ServiceStatusBadgeProps) {
  return (
    <StatusBadge
      label={serviceStatusLabels[status]}
      variant={status}
      className={className}
    />
  )
}
