/**
 * Modal form for creating or editing a service.
 */

import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'

import type { ServiceFormInput } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import {
  serviceCategoryLabels,
  serviceEnvironmentLabels,
} from '../../types/service.ts'
import { serviceStatusLabels } from '../../lib/overview-stats.ts'
import { cn } from '../../lib/utils.ts'

const serviceFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['operational', 'degraded', 'down']),
  category: z.enum(['application', 'infrastructure', 'platform']),
  environment: z.enum(['production', 'staging', 'development']),
  team: z.string().min(2, 'Team name is required'),
  ownerId: z.string().min(1, 'Select an owner'),
})

interface ServiceFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  users: User[]
  initialValues?: ServiceFormInput
  onClose: () => void
  onSubmit: (input: ServiceFormInput) => void
}

const defaultValues: ServiceFormInput = {
  name: '',
  description: '',
  status: 'operational',
  category: 'application',
  environment: 'production',
  team: '',
  ownerId: '',
}

export default function ServiceFormDialog({
  open,
  mode,
  users,
  initialValues,
  onClose,
  onSubmit,
}: ServiceFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput>({
    defaultValues: initialValues ?? defaultValues,
    values: initialValues,
  })

  if (!open) {
    return null
  }

  const submit = handleSubmit((data) => {
    const parsed = serviceFormSchema.safeParse(data)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ServiceFormInput
        setError(field, { message: issue.message })
      })
      return
    }

    onSubmit(parsed.data)
    reset(defaultValues)
    onClose()
  })

  const title = mode === 'create' ? 'Create Service' : 'Edit Service'
  const submitLabel = mode === 'create' ? 'Create Service' : 'Save Changes'

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
                className={inputClassName(!!errors.name)}
                placeholder="e.g. API Gateway"
              />
            </FormField>

            <FormField label="Description" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                className={cn(inputClassName(!!errors.description), 'resize-none')}
                placeholder="Describe what this service does..."
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Status" error={errors.status?.message}>
                <select {...register('status')} className={inputClassName(!!errors.status)}>
                  {(['operational', 'degraded', 'down'] as const).map((status) => (
                    <option key={status} value={status}>
                      {serviceStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Category" error={errors.category?.message}>
                <select {...register('category')} className={inputClassName(!!errors.category)}>
                  {Object.entries(serviceCategoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Environment" error={errors.environment?.message}>
                <select
                  {...register('environment')}
                  className={inputClassName(!!errors.environment)}
                >
                  {Object.entries(serviceEnvironmentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Team" error={errors.team?.message}>
                <input
                  {...register('team')}
                  className={inputClassName(!!errors.team)}
                  placeholder="e.g. Platform Engineering"
                />
              </FormField>
            </div>

            <FormField label="Owner" error={errors.ownerId?.message}>
              <select {...register('ownerId')} className={inputClassName(!!errors.ownerId)}>
                <option value="">Select an owner</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
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
                {submitLabel}
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
