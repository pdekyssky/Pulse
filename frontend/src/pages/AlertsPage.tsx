/**
 * Alert monitoring page with API-backed list, filters, stats, and admin mutations.
 */

import { useCallback, useMemo, useState } from 'react'

import AlertFilters from '../components/alerts/AlertFilters.tsx'
import AlertFormDialog from '../components/alerts/AlertFormDialog.tsx'
import AlertPagination from '../components/alerts/AlertPagination.tsx'
import AlertsHeader from '../components/alerts/AlertsHeader.tsx'
import AlertStats from '../components/alerts/AlertStats.tsx'
import AlertTable from '../components/alerts/AlertTable.tsx'
import QueryState from '../components/common/QueryState.tsx'
import Toast from '../components/ui/Toast.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import {
  useAcknowledgeAlert,
  useAlertsList,
  useCreateAlert,
  useResolveAlert,
} from '../hooks/useAlertsQuery.ts'
import { useServices } from '../hooks/useServices.ts'
import { ApiError } from '../lib/api/client.ts'
import {
  defaultAlertFilters,
  type AlertFilters as AlertFiltersState,
} from '../lib/alert-stats.ts'
import { buildAlertListParams, mapAlertFormToCreateBody } from '../lib/mappers/alert.ts'
import type { AlertCreateFormInput } from '../types/alert.ts'
import type { Alert } from '../types/alert.ts'

function parseAlertId(id: string): number {
  const alertId = Number.parseInt(id, 10)
  if (Number.isNaN(alertId)) {
    throw new Error('Invalid alert ID')
  }
  return alertId
}

export default function AlertsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [filters, setFilters] = useState<AlertFiltersState>(defaultAlertFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [mutatingAlertId, setMutatingAlertId] = useState<string | null>(null)

  const listParams = useMemo(
    () => buildAlertListParams(filters, page, pageSize),
    [filters, page, pageSize],
  )

  const {
    data: alertData,
    isLoading: isAlertsLoading,
    error: alertsError,
  } = useAlertsList(listParams)
  const { data: services = [], isLoading: isServicesLoading, error: servicesError } = useServices()
  const createAlertMutation = useCreateAlert()
  const acknowledgeAlertMutation = useAcknowledgeAlert()
  const resolveAlertMutation = useResolveAlert()

  const alerts = alertData?.items ?? []

  const handleFiltersChange = (nextFilters: AlertFiltersState) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const openCreateForm = useCallback(() => {
    setSubmitError(null)
    setIsCreateOpen(true)
  }, [])

  const closeCreateForm = useCallback(() => {
    setIsCreateOpen(false)
    setSubmitError(null)
    createAlertMutation.reset()
  }, [createAlertMutation])

  const dismissToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  const handleCreateSubmit = useCallback(
    async (input: AlertCreateFormInput) => {
      setSubmitError(null)

      try {
        const body = mapAlertFormToCreateBody(input)
        await createAlertMutation.mutateAsync(body)
        closeCreateForm()
        setToastMessage('Alert created successfully.')
      } catch (mutationError) {
        const message =
          mutationError instanceof ApiError
            ? mutationError.message
            : mutationError instanceof Error
              ? mutationError.message
              : 'Request failed'

        setSubmitError(message)
      }
    },
    [closeCreateForm, createAlertMutation],
  )

  const handleAcknowledge = useCallback(
    async (alert: Alert) => {
      setActionError(null)
      setMutatingAlertId(alert.id)

      try {
        await acknowledgeAlertMutation.mutateAsync(parseAlertId(alert.id))
        setToastMessage(`Alert "${alert.title}" acknowledged.`)
      } catch (mutationError) {
        const message =
          mutationError instanceof ApiError
            ? mutationError.message
            : mutationError instanceof Error
              ? mutationError.message
              : 'Request failed'

        setActionError(message)
      } finally {
        setMutatingAlertId(null)
      }
    },
    [acknowledgeAlertMutation],
  )

  const handleResolve = useCallback(
    async (alert: Alert) => {
      setActionError(null)
      setMutatingAlertId(alert.id)

      try {
        await resolveAlertMutation.mutateAsync(parseAlertId(alert.id))
        setToastMessage(`Alert "${alert.title}" resolved.`)
      } catch (mutationError) {
        const message =
          mutationError instanceof ApiError
            ? mutationError.message
            : mutationError instanceof Error
              ? mutationError.message
              : 'Request failed'

        setActionError(message)
      } finally {
        setMutatingAlertId(null)
      }
    },
    [resolveAlertMutation],
  )

  const isLoading =
    (isServicesLoading && services.length === 0) ||
    (isAlertsLoading && alertData === undefined)
  const error = alertsError ?? servicesError

  return (
    <QueryState isLoading={isLoading} error={error} loadingMessage="Loading alerts...">
      <div className="space-y-6">
        <AlertsHeader onCreateClick={isAdmin ? openCreateForm : undefined} />
        {actionError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </p>
        )}
        <AlertStats alerts={alerts} />
        <AlertFilters filters={filters} services={services} onChange={handleFiltersChange} />
        <AlertTable
          alerts={alerts}
          totalCount={alertData?.total ?? 0}
          services={services}
          onAcknowledge={isAdmin ? handleAcknowledge : undefined}
          onResolve={isAdmin ? handleResolve : undefined}
          mutatingAlertId={mutatingAlertId}
        />
        <AlertPagination
          page={alertData?.page ?? page}
          totalPages={alertData?.total_pages ?? 0}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() =>
            setPage((current) =>
              alertData?.total_pages ? Math.min(alertData.total_pages, current + 1) : current,
            )
          }
        />

        {isAdmin && (
          <AlertFormDialog
            open={isCreateOpen}
            services={services}
            onClose={closeCreateForm}
            onSubmit={handleCreateSubmit}
            isPending={createAlertMutation.isPending}
            submitError={submitError}
          />
        )}

        <Toast message={toastMessage} onClose={dismissToast} />
      </div>
    </QueryState>
  )
}
