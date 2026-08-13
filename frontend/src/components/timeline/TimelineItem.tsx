/**
 * Single timeline event with icon, timestamp, and description.
 */

import { createElement } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Rocket,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { Service } from '../../types/service.ts'
import type { TimelineEvent, TimelineEventType } from '../../types/timeline.ts'
import { timelineEventTypeLabels } from '../../types/timeline.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import ServiceIcon from '../services/ServiceIcon.tsx'
import { formatDateTime, formatIncidentId, formatTime } from '../../lib/format.ts'
import { cn } from '../../lib/utils.ts'

interface TimelineItemProps {
  event: TimelineEvent
  service?: Service
  isLast: boolean
}

const eventIcons: Record<TimelineEventType, LucideIcon> = {
  incident_created: AlertTriangle,
  incident_updated: Clock,
  incident_resolved: CheckCircle2,
  alert_triggered: Bell,
  alert_acknowledged: ShieldAlert,
  service_degraded: TrendingDown,
  service_recovered: TrendingUp,
  deployment: Rocket,
  maintenance: Wrench,
}

const eventMarkerStyles: Record<TimelineEventType, string> = {
  incident_created: 'bg-red-100 text-red-600 ring-red-200',
  incident_updated: 'bg-purple-100 text-purple-600 ring-purple-200',
  incident_resolved: 'bg-green-100 text-green-600 ring-green-200',
  alert_triggered: 'bg-orange-100 text-orange-600 ring-orange-200',
  alert_acknowledged: 'bg-purple-100 text-purple-600 ring-purple-200',
  service_degraded: 'bg-orange-100 text-orange-600 ring-orange-200',
  service_recovered: 'bg-green-100 text-green-600 ring-green-200',
  deployment: 'bg-blue-100 text-blue-600 ring-blue-200',
  maintenance: 'bg-gray-100 text-gray-600 ring-gray-200',
}

const severityVariants = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  info: 'low',
} as const

export default function TimelineItem({ event, service, isLast }: TimelineItemProps) {
  const icon = eventIcons[event.type]

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
            eventMarkerStyles[event.type],
          )}
        >
          {createElement(icon, { className: 'size-4', 'aria-hidden': true })}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200" />}
      </div>

      <div className={cn('min-w-0 flex-1', !isLast && 'pb-8')}>
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {formatTime(event.timestamp)}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs font-medium text-pulse-600">
              {timelineEventTypeLabels[event.type]}
            </span>
            {event.severity && (
              <StatusBadge
                label={event.severity}
                variant={severityVariants[event.severity]}
                className="text-[10px]"
              />
            )}
          </div>

          <h4 className="mt-2 font-semibold text-gray-900">{event.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{event.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {service && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1">
                <ServiceIcon serviceId={service.id} className="size-3" />
                {service.name}
              </span>
            )}
            {event.incidentId && (
              <span className="rounded-full bg-purple-50 px-2.5 py-1 font-medium text-purple-700">
                {formatIncidentId(event.incidentId)}
              </span>
            )}
            {event.alertId && (
              <span className="rounded-full bg-orange-50 px-2.5 py-1 font-medium text-orange-700">
                {event.alertId.toUpperCase()}
              </span>
            )}
            <span className="text-gray-400">{formatDateTime(event.timestamp)}</span>
          </div>
        </article>
      </div>
    </div>
  )
}
