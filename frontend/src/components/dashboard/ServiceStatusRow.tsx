/**
 * Single row in the service status overview table.
 */

import { Link } from 'react-router-dom'

import type { Service } from '../../types/service.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import ServiceIcon from '../services/ServiceIcon.tsx'
import { formatUptime } from '../../lib/format.ts'
import { parseServiceNumericId } from '../../lib/service-utils.ts'
import { serviceStatusLabels } from '../../lib/overview-stats.ts'

interface ServiceStatusRowProps {
  service: Service
}

export default function ServiceStatusRow({ service }: ServiceStatusRowProps) {
  const numericId = parseServiceNumericId(service.id)
  const href = numericId ? `/services/${numericId}` : '/services'

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3.5 pr-4">
        <Link to={href} className="flex items-center gap-3 hover:text-pulse-700">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <ServiceIcon serviceId={service.id} className="size-4" />
          </div>
          <span className="font-medium text-gray-900">{service.name}</span>
        </Link>
      </td>
      <td className="py-3.5 pr-4">
        <StatusBadge label={serviceStatusLabels[service.status]} variant={service.status} />
      </td>
      <td className="py-3.5 pr-4 text-sm text-gray-600">{formatUptime(service.uptime)}</td>
    </tr>
  )
}
