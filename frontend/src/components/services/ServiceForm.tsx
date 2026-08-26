/**
 * Modal form for creating or editing a service.
 */

import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'

import type { ServiceFormInput, ServiceStatus } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import { serviceStatusLabels } from '../../lib/overview-stats.ts'
import { cn } from '../../lib/utils.ts'

const uptimeSchema = z
  .number({ message: 'Enter a valid uptime percentage' })
  .refine((value) => !Number.isNaN(value), 'Uptime is required')
  .min(0, 'Uptime must be at least 0')
  .max(999.99, 'Uptime must be at most 999.99')
  .refine(
    (value) => Math.round(value * 100) / 100 === value,
    'Uptime allows at most 2 decimal places',
  )

const serviceFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string(),
  ownerId: z.string().min(1, 'Select an owner'),
  status: z.enum(['operational', 'degraded', 'down']),
  uptime: uptimeSchema,
})

interface ServiceFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  users: User[]
  initialValues?: ServiceFormInput
  onClose: () => void
  onSubmit: (input: ServiceFormInput) => void | Promise<void>
  isPending?: boolean
  submitError?: string | null
}

const defaultValues: ServiceFormInput = {
  name: '',
  description: '',
  status: 'operational',
  ownerId: '',
}

export default function ServiceFormDialog({
  open,
  mode,
  users,
  initialValues,
  onClose,
  onSubmit,
  isPending = false,
  submitError = null,
}: ServiceFormDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput>({
    defaultValues: initialValues ?? defaultValues,
    values: initialValues,
  })

  if (!open) {
    return null
  }

  const submit = handleSubmit(async (data) => {
    const parsed = serviceFormSchema.safeParse(data)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ServiceFormInput
        setError(field, { message: issue.message })
      })
      return
    }

    await onSubmit(parsed.data)
  })

  const title = mode === 'create' ? 'Create Service' : 'Edit Service'
  const submitLabel = mode === 'create' ? 'Create Service' : 'Save Changes'
  const pending = isSubmitting || isPending
  const pendingLabel = mode === 'create' ? 'Creating...' : 'Saving...'
  const assignableUsers = users.filter((user) => user.status !== 'inactive')

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
          aria-labelledby="service-form-title"
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 id="service-form-title" className="text-lg font-semibold text-gray-900">
              {title}
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
            <FormField label="Name" error={errors.name?.message}>
              <input
                {...register('name')}
                disabled={pending}
                className={inputClassName(!!errors.name)}
                placeholder="e.g. API Gateway"
              />
            </FormField>

            <FormField label="Description" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                disabled={pending}
                className={cn(inputClassName(!!errors.description), 'resize-none')}
                placeholder="Describe what this service does (optional)"
              />
            </FormField>

            <FormField label="Status" error={errors.status?.message}>
              <select
                {...register('status')}
                disabled={pending}
                className={inputClassName(!!errors.status)}
              >
                {(Object.keys(serviceStatusLabels) as ServiceStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {serviceStatusLabels[status]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Uptime (%)"
              error={errors.uptime?.message}
              hint="Stored uptime value (0–999.99). This is not live telemetry."
            >
              <input
                type="number"
                step="0.01"
                min="0"
                max="999.99"
                disabled={pending}
                {...register('uptime', { valueAsNumber: true })}
                className={inputClassName(!!errors.uptime)}
                placeholder="e.g. 99.95"
              />
            </FormField>

            <FormField label="Owner" error={errors.ownerId?.message}>
              <select
                {...register('ownerId')}
                disabled={pending}
                className={inputClassName(!!errors.ownerId)}
              >
                <option value="">Select an owner</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
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
                {pending ? pendingLabel : submitLabel}
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
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function inputClassName(hasError: boolean) {
  return cn(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:outline-none disabled:opacity-50',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-200 focus:border-pulse-500 focus:ring-pulse-500/20',
  )
}
