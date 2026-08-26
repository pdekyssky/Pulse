/**
 * Table listing all services with status and uptime.
 */

import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Service } from '../../types/service.ts'
import Card from '../ui/Card.tsx'
import ServiceStatusRow from './ServiceStatusRow.tsx'

interface ServiceStatusTableProps {
  services: Service[]
}

export default function ServiceStatusTable({ services }: ServiceStatusTableProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">Service Status</h3>
      </div>

      <div className="overflow-x-auto px-5">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="py-3 pr-4 font-medium">Service</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 font-medium">Uptime</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <ServiceStatusRow key={service.id} service={service} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto border-t border-gray-100 px-5 py-3">
        <Link
          to="/services"
          className="inline-flex items-center gap-1 text-sm font-medium text-pulse-600 transition-colors hover:text-pulse-700"
        >
          View all services
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
