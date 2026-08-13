/**
 * Colored badge for alert acknowledgment status.
 */

import type { AlertStatus } from '../../types/alert.ts'
import { alertStatusLabels } from '../../types/alert.ts'
import StatusBadge from '../ui/StatusBadge.tsx'

interface AlertStatusBadgeProps {
  status: AlertStatus
  className?: string
}

export default function AlertStatusBadge({ status, className }: AlertStatusBadgeProps) {
  return (
    <StatusBadge label={alertStatusLabels[status]} variant={status} className={className} />
  )
}
