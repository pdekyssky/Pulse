/**
 * Modal form for creating a new incident.
 */

import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'

import type { Service } from '../../types/service.ts'
import type { CreateIncidentInput, IncidentPriority } from '../../types/incident.ts'
import { incidentPriorityLabels } from '../../types/incident.ts'
import { cn } from '../../lib/utils.ts'

const createIncidentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  affectedServiceId: z.string().min(1, 'Select an affected service'),
})

interface CreateIncidentDialogProps {
  open: boolean
  services: Service[]
  onClose: () => void
  onSubmit: (input: CreateIncidentInput) => void | Promise<void>
  isPending?: boolean
  submitError?: string | null
}

export default function CreateIncidentDialog({
  open,
  services,
  onClose,
  onSubmit,
  isPending = false,
  submitError = null,
}: CreateIncidentDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateIncidentInput>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      affectedServiceId: '',
    },
  })

  if (!open) {
    return null
  }

  const submit = handleSubmit(async (data) => {
    const parsed = createIncidentSchema.safeParse(data)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateIncidentInput
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
          aria-labelledby="create-incident-title"
          className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 id="create-incident-title" className="text-lg font-semibold text-gray-900">
              Create Incident
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
            <Field label="Title" error={errors.title?.message}>
              <input
                {...register('title')}
                disabled={pending}
                className={inputClass(!!errors.title)}
                placeholder="Brief incident title"
              />
            </Field>

            <Field label="Description" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                disabled={pending}
                className={cn(inputClass(!!errors.description), 'resize-none')}
                placeholder="Describe the incident impact and symptoms"
              />
            </Field>

            <Field label="Severity" error={errors.priority?.message}>
              <select
                {...register('priority')}
                disabled={pending}
                className={inputClass(!!errors.priority)}
              >
                {(Object.keys(incidentPriorityLabels) as IncidentPriority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {incidentPriorityLabels[priority]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Service" error={errors.affectedServiceId?.message}>
              <select
                {...register('affectedServiceId')}
                disabled={pending}
                className={inputClass(!!errors.affectedServiceId)}
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </Field>

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
                className="rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pulse-700 disabled:opacity-60"
              >
                {pending ? 'Creating...' : 'Create Incident'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

function Field({
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

function inputClass(hasError: boolean): string {
  return cn(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:outline-none disabled:opacity-50',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-200 focus:border-pulse-500 focus:ring-pulse-500/20',
  )
}
