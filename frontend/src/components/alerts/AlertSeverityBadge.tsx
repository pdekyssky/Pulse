/**
 * Colored badge for alert severity level.
 */

import type { AlertSeverity } from '../../types/alert.ts'
import { alertSeverityLabels } from '../../types/alert.ts'
import StatusBadge from '../ui/StatusBadge.tsx'

const severityVariants: Record<AlertSeverity, 'critical' | 'warning' | 'low'> = {
  critical: 'critical',
  warning: 'warning',
  info: 'low',
}

interface AlertSeverityBadgeProps {
  severity: AlertSeverity
  className?: string
}

export default function AlertSeverityBadge({ severity, className }: AlertSeverityBadgeProps) {
  return (
    <StatusBadge
      label={alertSeverityLabels[severity]}
      variant={severityVariants[severity]}
      className={className}
    />
  )
}
