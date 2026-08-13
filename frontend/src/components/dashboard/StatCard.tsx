/**
 * Single KPI metric card with icon and trend indicator.
 */

import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import Card from '../ui/Card.tsx'
import { cn } from '../../lib/utils.ts'

type StatVariant = 'default' | 'operational' | 'degraded' | 'down' | 'incidents'

interface StatCardProps {
  label: string
  value: number | string
  subtext?: string
  subtextHref?: string
  icon: LucideIcon
  variant?: StatVariant
}

const iconStyles: Record<StatVariant, string> = {
  default: 'bg-pulse-100 text-pulse-600',
  operational: 'bg-green-100 text-green-600',
  degraded: 'bg-orange-100 text-orange-600',
  down: 'bg-red-100 text-red-600',
  incidents: 'bg-pulse-100 text-pulse-600',
}

const subtextStyles: Record<StatVariant, string> = {
  default: 'text-gray-500',
  operational: 'text-green-600',
  degraded: 'text-orange-600',
  down: 'text-red-600',
  incidents: 'text-pulse-600',
}

export default function StatCard({
  label,
  value,
  subtext,
  subtextHref,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
          {subtext &&
            (subtextHref ? (
              <Link
                to={subtextHref}
                className={cn('text-sm font-medium hover:underline', subtextStyles[variant])}
              >
                {subtext}
              </Link>
            ) : (
              <p className={cn('text-sm font-medium', subtextStyles[variant])}>{subtext}</p>
            ))}
        </div>
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-lg',
            iconStyles[variant],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </Card>
  )
}
