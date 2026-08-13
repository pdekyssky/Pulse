/**
 * Generic colored badge for operational status labels.
 */

import { cn } from '../../lib/utils.ts'

type BadgeVariant =
  | 'operational'
  | 'degraded'
  | 'down'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved'
  | 'active'
  | 'acknowledged'
  | 'warning'

interface StatusBadgeProps {
  label: string
  variant: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  operational: 'bg-green-50 text-green-700 ring-green-600/20',
  degraded: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  down: 'bg-red-50 text-red-700 ring-red-600/20',
  critical: 'bg-red-50 text-red-700 ring-red-600/20',
  high: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  medium: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  low: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  investigating: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  identified: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  monitoring: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  resolved: 'bg-green-50 text-green-700 ring-green-600/20',
  active: 'bg-red-50 text-red-700 ring-red-600/20',
  acknowledged: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  warning: 'bg-orange-50 text-orange-700 ring-orange-600/20',
}

export default function StatusBadge({ label, variant, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset',
        variantStyles[variant],
        className,
      )}
    >
      {label}
    </span>
  )
}
