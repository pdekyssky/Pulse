/**
 * Slide-over panel showing incident details and timeline.
 */

import { useState } from 'react'
import { CheckCircle2, ChevronDown, X } from 'lucide-react'

import type { Incident, IncidentStatus } from '../../types/incident.ts'
import type { Service } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import StatusBadge from '../ui/StatusBadge.tsx'
import ServiceIcon from '../services/ServiceIcon.tsx'
import IncidentTimeline, { IncidentCommentList } from './IncidentTimeline.tsx'
import {
  formatDateTime,
  formatIncidentId,
  formatRelativeTime,
  formatTime,
  getInitials,
} from '../../lib/format.ts'
import {
  incidentPriorityLabels,
  incidentStatusLabels,
} from '../../types/incident.ts'
import { serviceStatusLabels } from '../../lib/overview-stats.ts'
import { cn } from '../../lib/utils.ts'

type DetailTab = 'timeline' | 'details' | 'logs' | 'services' | 'comments'

interface IncidentDetailPanelProps {
  incident: Incident | null
  services: Service[]
  users: User[]
  onClose: () => void
  onChangeStatus: (id: string, status: IncidentStatus) => void
  onResolve: (id: string) => void
}

const tabs: Array<{ id: DetailTab; label: string }> = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'details', label: 'Details' },
  { id: 'logs', label: 'Logs' },
  { id: 'services', label: 'Affected Services' },
  { id: 'comments', label: 'Comments' },
]

const logLevelStyles = {
  info: 'text-blue-600 bg-blue-50',
  warn: 'text-orange-600 bg-orange-50',
  error: 'text-red-600 bg-red-50',
} as const

export default function IncidentDetailPanel({
  incident,
  services,
  users,
  onClose,
  onChangeStatus,
  onResolve,
}: IncidentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('timeline')

  if (!incident) {
    return null
  }

  const assignee = users.find((user) => user.id === incident.assigneeId)
  const affectedServices = incident.affectedServiceIds
    .map((id) => services.find((service) => service.id === id))
    .filter((service): service is Service => service !== undefined)
  const primaryService = affectedServices[0]

  return (
    <>
      <button
        type="button"
        aria-label="Close incident details"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">
                  {formatIncidentId(incident.id)}
                </span>
                <StatusBadge
                  label={incidentPriorityLabels[incident.priority]}
                  variant={incident.priority}
                />
              </div>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">{incident.title}</h3>
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

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Status" value={incidentStatusLabels[incident.status]} />
            <MiniStat label="Priority" value={incidentPriorityLabels[incident.priority]} />
            <MiniStat label="Started" value={formatTime(incident.startedAt)} />
            <MiniStat label="Duration" value={incident.duration} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {incident.status !== 'resolved' && (
              <>
                <StatusAction
                  label="Change Status"
                  onSelect={(status) => onChangeStatus(incident.id, status)}
                  currentStatus={incident.status}
                />
                <button
                  type="button"
                  onClick={() => onResolve(incident.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Resolve
                </button>
              </>
            )}
          </div>
        </div>

        <div className="border-b border-gray-100 px-5">
          <nav className="-mb-px flex gap-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'shrink-0 border-b-2 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-pulse-600 text-pulse-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activeTab === 'timeline' && (
            <IncidentTimeline events={incident.timeline} users={users} />
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-gray-600">{incident.description}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailStat label="Assignee" value={assignee?.name ?? 'Unassigned'} />
                <DetailStat label="Primary Service" value={primaryService?.name ?? '—'} />
                <DetailStat label="Started" value={formatDateTime(incident.startedAt)} />
                <DetailStat
                  label="Relative"
                  value={formatRelativeTime(incident.startedAt)}
                />
              </div>
              {assignee && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-pulse-100 text-xs font-semibold text-pulse-700">
                    {getInitials(assignee.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{assignee.name}</p>
                    <p className="text-xs text-gray-500">{assignee.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {incident.logs.length > 0 ? (
                incident.logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                          logLevelStyles[log.level],
                        )}
                      >
                        {log.level}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(log.timestamp)}</span>
                    </div>
                    <p className="mt-1.5 font-mono text-xs text-gray-700">{log.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No logs available.</p>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-3">
              {affectedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <ServiceIcon serviceId={service.id} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.team}</p>
                  </div>
                  <StatusBadge
                    label={serviceStatusLabels[service.status]}
                    variant={service.status}
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <IncidentCommentList comments={incident.comments} users={users} />
          )}
        </div>
      </aside>
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 px-3 py-2.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

function StatusAction({
  label,
  currentStatus,
  onSelect,
}: {
  label: string
  currentStatus: IncidentStatus
  onSelect: (status: IncidentStatus) => void
}) {
  const options = (['investigating', 'identified', 'monitoring'] as IncidentStatus[]).filter(
    (status) => status !== currentStatus,
  )

  return (
    <div className="relative">
      <select
        aria-label={label}
        defaultValue=""
        onChange={(event) => {
          const value = event.target.value as IncidentStatus
          if (value) {
            onSelect(value)
            event.target.value = ''
          }
        }}
        className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-gray-700 shadow-sm focus:border-pulse-500 focus:outline-none"
      >
        <option value="" disabled>
          {label}
        </option>
        {options.map((status) => (
          <option key={status} value={status}>
            {incidentStatusLabels[status]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-gray-400" />
    </div>
  )
}
