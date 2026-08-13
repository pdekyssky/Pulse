/**
 * Single alert row with severity and status badges.
 */

import { Bell, CheckCircle2, Eye, MoreHorizontal } from 'lucide-react'

import type { Alert } from '../../types/alert.ts'
import type { Service } from '../../types/service.ts'
import ServiceIcon from '../services/ServiceIcon.tsx'
import AlertSeverityBadge from './AlertSeverityBadge.tsx'
import AlertStatusBadge from './AlertStatusBadge.tsx'
import { formatDateTime, formatRelativeTime } from '../../lib/format.ts'

interface AlertRowProps {
  alert: Alert
  service?: Service
}

export default function AlertRow({ alert, service }: AlertRowProps) {
  return (
    <tr className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50">
      <td className="px-5 py-4 pr-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <Bell className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{alert.title}</p>
            <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{alert.message}</p>
          </div>
        </div>
      </td>
      <td className="hidden py-4 pr-4 lg:table-cell">
        <p className="max-w-xs truncate text-sm text-gray-600">{alert.message}</p>
      </td>
      <td className="py-4 pr-4">
        <AlertSeverityBadge severity={alert.severity} />
      </td>
      <td className="py-4 pr-4">
        <AlertStatusBadge status={alert.status} />
      </td>
      <td className="hidden py-4 pr-4 md:table-cell">
        {service ? (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <ServiceIcon serviceId={service.id} className="size-3.5" />
            </div>
            <span className="text-sm text-gray-700">{service.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 sm:table-cell">
        <span title={formatDateTime(alert.createdAt)}>
          {formatRelativeTime(alert.createdAt)}
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            aria-label={`View ${alert.title}`}
            className="rounded-lg p-1.5 text-gray-400"
            tabIndex={-1}
          >
            <Eye className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Acknowledge ${alert.title}`}
            className="rounded-lg p-1.5 text-gray-400"
            tabIndex={-1}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`More actions for ${alert.title}`}
            className="rounded-lg p-1.5 text-gray-400"
            tabIndex={-1}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function AlertMobileCard({ alert, service }: AlertRowProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <AlertSeverityBadge severity={alert.severity} />
        <AlertStatusBadge status={alert.status} />
      </div>
      <p className="mt-2 font-medium text-gray-900">{alert.title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{alert.message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Service: {service?.name ?? '—'}</span>
        <span>{formatRelativeTime(alert.createdAt)}</span>
        <span>{formatDateTime(alert.createdAt)}</span>
      </div>
    </div>
  )
}
