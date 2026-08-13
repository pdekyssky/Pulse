/**
 * Single service row with status badge and uptime.
 */

import { Eye, Pencil } from 'lucide-react'

import type { Service } from '../../types/service.ts'
import ServiceIcon from './ServiceIcon.tsx'
import ServiceStatusBadge from './ServiceStatusBadge.tsx'
import {
  formatDateTime,
  formatRelativeTime,
  formatResponseTime,
  formatUptime,
} from '../../lib/format.ts'
import { serviceCategoryLabels } from '../../types/service.ts'

interface ServiceRowProps {
  service: Service
  onView: (service: Service) => void
  onEdit: (service: Service) => void
}

export default function ServiceRow({ service, onView, onEdit }: ServiceRowProps) {
  return (
    <tr className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50">
      <td className="px-5 py-4 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <ServiceIcon serviceId={service.id} className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{service.name}</p>
            <p className="truncate text-xs text-gray-500 md:hidden">{service.team}</p>
          </div>
        </div>
      </td>
      <td className="py-4 pr-4">
        <ServiceStatusBadge status={service.status} />
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 md:table-cell">
        {formatUptime(service.uptime)}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 sm:table-cell">
        {formatResponseTime(service.responseTime)}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 lg:table-cell">
        {serviceCategoryLabels[service.category]}
      </td>
      <td className="hidden py-4 pr-4 text-sm text-gray-600 xl:table-cell">
        <span title={formatDateTime(service.lastCheck)}>
          {formatRelativeTime(service.lastCheck)}
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            aria-label={`View ${service.name}`}
            onClick={() => onView(service)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <Eye className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Edit ${service.name}`}
            onClick={() => onEdit(service)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export function ServiceMobileCard({ service, onView, onEdit }: ServiceRowProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <ServiceIcon serviceId={service.id} className="size-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{service.name}</p>
            <p className="text-xs text-gray-500">{serviceCategoryLabels[service.category]}</p>
          </div>
        </div>
        <ServiceStatusBadge status={service.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <span>Uptime: {formatUptime(service.uptime)}</span>
        <span>Response: {formatResponseTime(service.responseTime)}</span>
        <span>Team: {service.team}</span>
        <span>Last check: {formatRelativeTime(service.lastCheck)}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onView(service)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          View
        </button>
        <button
          type="button"
          onClick={() => onEdit(service)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </button>
      </div>
    </div>
  )
}
