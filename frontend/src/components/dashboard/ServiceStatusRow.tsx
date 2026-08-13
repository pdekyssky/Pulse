/**
 * Single row in the service status overview table.
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from 'lucide-react'

import type { Service } from '../../types/service.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import ServiceIcon from '../services/ServiceIcon.tsx'
import { formatResponseTime, formatUptime } from '../../lib/format.ts'
import { serviceStatusLabels } from '../../lib/overview-stats.ts'

interface ServiceStatusRowProps {
  service: Service
}

function TrendIndicator({ status }: { status: Service['status'] }) {
  if (status === 'operational') {
    return (
      <div className="flex items-end gap-0.5" aria-label="Trending up">
        {[3, 5, 4, 7, 6].map((height, index) => (
          <span
            key={index}
            className="w-1 rounded-sm bg-green-400"
            style={{ height: `${height * 2}px` }}
          />
        ))}
        <ArrowUpRight className="size-3.5 text-green-500" aria-hidden="true" />
      </div>
    )
  }

  if (status === 'degraded') {
    return (
      <div className="flex items-end gap-0.5" aria-label="Unstable trend">
        {[5, 3, 6, 2, 4].map((height, index) => (
          <span
            key={index}
            className="w-1 rounded-sm bg-orange-400"
            style={{ height: `${height * 2}px` }}
          />
        ))}
        <Minus className="size-3.5 text-orange-500" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex items-end gap-0.5" aria-label="Trending down">
      {[7, 5, 4, 3, 2].map((height, index) => (
        <span
          key={index}
          className="w-1 rounded-sm bg-red-400"
          style={{ height: `${height * 2}px` }}
        />
      ))}
      <ArrowDownRight className="size-3.5 text-red-500" aria-hidden="true" />
    </div>
  )
}

export default function ServiceStatusRow({ service }: ServiceStatusRowProps) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <ServiceIcon serviceId={service.id} className="size-4" />
          </div>
          <span className="font-medium text-gray-900">{service.name}</span>
        </div>
      </td>
      <td className="py-3.5 pr-4">
        <StatusBadge label={serviceStatusLabels[service.status]} variant={service.status} />
      </td>
      <td className="py-3.5 pr-4 text-sm text-gray-600">{formatUptime(service.uptime)}</td>
      <td className="py-3.5 pr-4 text-sm text-gray-600">
        {formatResponseTime(service.responseTime)}
      </td>
      <td className="py-3.5">
        <TrendIndicator status={service.status} />
      </td>
    </tr>
  )
}
