/**
 * Table of current service health and incident counts for the selected period.
 */

import type { AnalyticsServiceItem } from '../../types/analytics.ts'
import ServiceIcon from '../services/ServiceIcon.tsx'
import ServiceStatusBadge from '../services/ServiceStatusBadge.tsx'
import { formatUptime } from '../../lib/format.ts'
import Card from '../ui/Card.tsx'

interface ServicePerformanceProps {
  rows: AnalyticsServiceItem[]
}

export default function ServicePerformance({ rows }: ServicePerformanceProps) {
  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">Service Health</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Current service status and incident volume in the selected period.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-gray-500">No services match the selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Recorded Uptime</th>
                <th className="px-5 py-3 font-medium">Incidents</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.serviceId} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <ServiceIcon serviceId={row.serviceId} className="size-4" />
                      </div>
                      <span className="font-medium text-gray-900">{row.serviceName}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <ServiceStatusBadge status={row.status} />
                  </td>
                  <td className="py-4 pr-4 text-sm text-gray-700">
                    {row.uptime === null ? '—' : formatUptime(row.uptime)}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{row.incidentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
