/**
 * Slide-over panel with service health and metric details.
 */

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  X,
} from 'lucide-react'

import type { Service } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import ServiceIcon from './ServiceIcon.tsx'
import {
  formatDateTime,
  formatRelativeTime,
  formatResponseTime,
  formatUptime,
  getInitials,
} from '../../lib/format.ts'
import { serviceStatusLabels } from '../../lib/overview-stats.ts'
import {
  serviceCategoryLabels,
  serviceEnvironmentLabels,
} from '../../types/service.ts'
import { cn } from '../../lib/utils.ts'

interface ServiceDetailsProps {
  service: Service | null
  owner?: User
  onClose: () => void
}

const statusIndicatorStyles: Record<Service['status'], string> = {
  operational: 'bg-green-500',
  degraded: 'bg-orange-500',
  down: 'bg-red-500',
}

const metricTrendIcons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  stable: Minus,
} as const

const metricTrendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-400',
} as const

export default function ServiceDetails({ service, owner, onClose }: ServiceDetailsProps) {
  if (!service) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close service details"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <ServiceIcon serviceId={service.id} className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge label={serviceStatusLabels[service.status]} variant={service.status} />
                <span
                  className={cn('size-2 rounded-full', statusIndicatorStyles[service.status])}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-sm leading-relaxed text-gray-600">{service.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <DetailStat label="Uptime" value={formatUptime(service.uptime)} />
            <DetailStat label="Response Time" value={formatResponseTime(service.responseTime)} />
            <DetailStat label="Owner" value={owner?.name ?? 'Unassigned'} />
            <DetailStat
              label="Last Check"
              value={formatRelativeTime(service.lastCheck)}
              subtext={formatDateTime(service.lastCheck)}
            />
            <DetailStat label="Team" value={service.team} />
            <DetailStat label="Category" value={serviceCategoryLabels[service.category]} />
            <DetailStat
              label="Environment"
              value={serviceEnvironmentLabels[service.environment]}
            />
            <DetailStat label="Created" value={formatDateTime(service.createdAt)} />
          </div>

          <section className="mt-8">
            <h4 className="text-sm font-semibold text-gray-900">Recent Metrics</h4>
            <div className="mt-3 space-y-2">
              {service.recentMetrics.map((metric) => {
                const TrendIcon = metric.trend ? metricTrendIcons[metric.trend] : Minus

                return (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5"
                  >
                    <span className="text-sm text-gray-600">{metric.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900">{metric.value}</span>
                      {metric.trend && (
                        <TrendIcon
                          className={cn('size-3.5', metricTrendColors[metric.trend])}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-8">
            <h4 className="text-sm font-semibold text-gray-900">Recent Health Checks</h4>
            <div className="mt-3 space-y-3">
              {service.healthChecks.map((check) => (
                <div key={check.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn('size-2.5 rounded-full', statusIndicatorStyles[check.status])}
                    />
                    <div className="mt-1 w-px flex-1 bg-gray-200" />
                  </div>
                  <div className="min-w-0 flex-1 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">{formatDateTime(check.timestamp)}</span>
                      <StatusBadge
                        label={serviceStatusLabels[check.status]}
                        variant={check.status}
                        className="text-[10px]"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className="size-4" aria-hidden="true" />
            <span>Monitoring active · checked {formatRelativeTime(service.lastCheck)}</span>
          </div>
          {owner && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-pulse-100 text-xs font-semibold text-pulse-700">
                {getInitials(owner.name)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{owner.name}</p>
                <p className="text-xs text-gray-500">{owner.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

function DetailStat({
  label,
  value,
  subtext,
}: {
  label: string
  value: string
  subtext?: string
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
      {subtext && <p className="mt-0.5 text-xs text-gray-400">{subtext}</p>}
    </div>
  )
}
