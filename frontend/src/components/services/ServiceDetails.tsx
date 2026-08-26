/**
 * Slide-over panel with real service fields and related incidents.
 */

import { X } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Service } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import ServiceIcon from './ServiceIcon.tsx'
import { useIncidentsList } from '../../hooks/useIncidentsQuery.ts'
import {
  formatDateTime,
  formatIncidentId,
  formatRelativeTime,
  formatUptime,
  getInitials,
} from '../../lib/format.ts'
import { parseIncidentNumericId } from '../../lib/incident-utils.ts'
import { parseServiceNumericId } from '../../lib/service-utils.ts'
import { serviceStatusLabels } from '../../lib/overview-stats.ts'
import { incidentStatusLabels } from '../../types/incident.ts'
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

export default function ServiceDetails({ service, owner, onClose }: ServiceDetailsProps) {
  const numericId = service ? parseServiceNumericId(service.id) : null
  const {
    data: incidentData,
    isLoading: isIncidentsLoading,
    error: incidentsError,
  } = useIncidentsList(
    numericId ? { service_id: numericId, page_size: 10 } : {},
    Boolean(numericId),
  )

  if (!service) {
    return null
  }

  const relatedIncidents = incidentData?.items ?? []

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
          <p className="text-sm leading-relaxed text-gray-600">
            {service.description || 'No description provided.'}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <DetailStat label="Uptime" value={formatUptime(service.uptime)} />
            <DetailStat
              label="Owner"
              value={owner?.name ?? (service.ownerId ? `User #${service.ownerId}` : 'Unassigned')}
            />
            <DetailStat
              label="Created"
              value={formatDateTime(service.createdAt)}
              subtext={formatRelativeTime(service.createdAt)}
            />
            <DetailStat
              label="Updated"
              value={formatDateTime(service.updatedAt ?? service.createdAt)}
              subtext={formatRelativeTime(service.updatedAt ?? service.createdAt)}
            />
          </div>

          <section className="mt-8">
            <h4 className="text-sm font-semibold text-gray-900">Related incidents</h4>
            <div className="mt-3 space-y-2">
              {isIncidentsLoading ? (
                <p className="text-sm text-gray-500">Loading incidents...</p>
              ) : incidentsError ? (
                <p className="text-sm text-red-600">{incidentsError.message}</p>
              ) : relatedIncidents.length === 0 ? (
                <p className="text-sm text-gray-500">No incidents for this service.</p>
              ) : (
                relatedIncidents.map((incident) => {
                  const incidentId = parseIncidentNumericId(incident.id)
                  const href = incidentId ? `/incidents/${incidentId}` : '/incidents'

                  return (
                    <Link
                      key={incident.id}
                      to={href}
                      className="block rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 transition-colors hover:border-gray-200 hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-500">
                          {formatIncidentId(incident.id)}
                        </span>
                        <StatusBadge
                          label={incidentStatusLabels[incident.status]}
                          variant={incident.status}
                          className="text-[10px]"
                        />
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-900">{incident.title}</p>
                    </Link>
                  )
                })
              )}
            </div>
          </section>
        </div>

        {owner && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-pulse-100 text-xs font-semibold text-pulse-700">
                {getInitials(owner.name)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{owner.name}</p>
                <p className="text-xs text-gray-500">{owner.email}</p>
              </div>
            </div>
          </div>
        )}
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
