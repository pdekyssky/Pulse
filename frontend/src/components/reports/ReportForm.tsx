/**
 * Modal form for generating a new report.
 */

import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'

import type { Service } from '../../types/service.ts'
import type { ReportFormInput, ReportType } from '../../types/report.ts'
import { reportTypeLabels } from '../../types/report.ts'
import { cn } from '../../lib/utils.ts'

const reportFormSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    type: z.enum([
      'incident_summary',
      'service_availability',
      'performance',
      'alert_summary',
      'monthly_operations',
    ]),
    periodStart: z.string().min(1, 'Start date is required'),
    periodEnd: z.string().min(1, 'End date is required'),
    scope: z.string().min(1, 'Select a scope'),
    description: z.string().optional(),
  })
  .refine((data) => new Date(data.periodEnd) >= new Date(data.periodStart), {
    message: 'End date must be on or after start date',
    path: ['periodEnd'],
  })

interface ReportFormDialogProps {
  open: boolean
  services: Service[]
  onClose: () => void
  onSubmit: (input: ReportFormInput) => void
}

const defaultValues: ReportFormInput = {
  name: '',
  type: 'incident_summary',
  periodStart: '',
  periodEnd: '',
  scope: 'all',
  description: '',
}

export default function ReportFormDialog({
  open,
  services,
  onClose,
  onSubmit,
}: ReportFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormInput>({
    defaultValues,
  })

  if (!open) {
    return null
  }

  const submit = handleSubmit((data) => {
    const parsed = reportFormSchema.safeParse(data)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ReportFormInput
        setError(field, { message: issue.message })
      })
      return
    }

    onSubmit(parsed.data)
    reset(defaultValues)
    onClose()
  })

  return (
    <>
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-form-title"
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 id="report-form-title" className="text-lg font-semibold text-gray-900">
              Generate Report
            </h3>
            <button
              type="button"
              aria-label="Close"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={onClose}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4 px-5 py-5">
            <FormField label="Report Name" error={errors.name?.message}>
              <input
                {...register('name')}
                className={inputClassName(!!errors.name)}
                placeholder="e.g. August Incident Summary"
              />
            </FormField>

            <FormField label="Report Type" error={errors.type?.message}>
              <select {...register('type')} className={inputClassName(!!errors.type)}>
                {(Object.entries(reportTypeLabels) as Array<[ReportType, string]>).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Period Start" error={errors.periodStart?.message}>
                <input
                  type="date"
                  {...register('periodStart')}
                  className={inputClassName(!!errors.periodStart)}
                />
              </FormField>

              <FormField label="Period End" error={errors.periodEnd?.message}>
                <input
                  type="date"
                  {...register('periodEnd')}
                  className={inputClassName(!!errors.periodEnd)}
                />
              </FormField>
            </div>

            <FormField label="Scope" error={errors.scope?.message}>
              <select {...register('scope')} className={inputClassName(!!errors.scope)}>
                <option value="all">All services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Description (optional)" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                className={cn(inputClassName(!!errors.description), 'resize-none')}
                placeholder="Add notes about this report..."
              />
            </FormField>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pulse-700 disabled:opacity-50"
              >
                Generate Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function inputClassName(hasError: boolean) {
  return cn(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:outline-none',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-200 focus:border-pulse-500 focus:ring-pulse-500/20',
  )
}
