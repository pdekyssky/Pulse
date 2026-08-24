/**
 * Modal form for creating an alert.
 */

import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'

import type { ApiAlertSeverity } from '../../types/api/alert.ts'
import type { AlertCreateFormInput } from '../../types/alert.ts'
import type { Service } from '../../types/service.ts'
import { apiAlertSeverityLabels } from '../../types/alert.ts'
import { cn } from '../../lib/utils.ts'

const alertFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  serviceId: z.string().min(1, 'Select a service'),
})

interface AlertFormDialogProps {
  open: boolean
  services: Service[]
  onClose: () => void
  onSubmit: (input: AlertCreateFormInput) => void | Promise<void>
  isPending?: boolean
  submitError?: string | null
}

const defaultValues: AlertCreateFormInput = {
  name: '',
  description: '',
  severity: 'medium',
  serviceId: '',
}

export default function AlertFormDialog({
  open,
  services,
  onClose,
  onSubmit,
  isPending = false,
  submitError = null,
}: AlertFormDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AlertCreateFormInput>({
    defaultValues,
  })

  if (!open) {
    return null
  }

  const submit = handleSubmit(async (data) => {
    const parsed = alertFormSchema.safeParse(data)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AlertCreateFormInput
        setError(field, { message: issue.message })
      })
      return
    }

    await onSubmit(parsed.data)
  })

  const pending = isSubmitting || isPending

  return (
    <>
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        disabled={pending}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-form-title"
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 id="alert-form-title" className="text-lg font-semibold text-gray-900">
              Create Alert
            </h3>
            <button
              type="button"
              aria-label="Close"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              onClick={onClose}
              disabled={pending}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4 px-5 py-5">
            <FormField label="Name" error={errors.name?.message}>
              <input
                {...register('name')}
                className={inputClassName(!!errors.name)}
                placeholder="e.g. Database connection failures"
              />
            </FormField>

            <FormField label="Description" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                className={cn(inputClassName(!!errors.description), 'resize-none')}
                placeholder="Describe what triggered this alert..."
              />
            </FormField>

            <FormField label="Severity" error={errors.severity?.message}>
              <select {...register('severity')} className={inputClassName(!!errors.severity)}>
                {(Object.keys(apiAlertSeverityLabels) as ApiAlertSeverity[]).map((severity) => (
                  <option key={severity} value={severity}>
                    {apiAlertSeverityLabels[severity]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Service" error={errors.serviceId?.message}>
              <select {...register('serviceId')} className={inputClassName(!!errors.serviceId)}>
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </FormField>

            {submitError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pulse-700 disabled:opacity-50"
              >
                {pending ? 'Creating...' : 'Create Alert'}
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
