/**
 * Modal form for creating a new incident.
 */

import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'

import type { Service } from '../../types/service.ts'
import type { User } from '../../types/user.ts'
import type { CreateIncidentInput, IncidentPriority } from '../../types/incident.ts'
import { incidentPriorityLabels } from '../../types/incident.ts'
import { cn } from '../../lib/utils.ts'

const createIncidentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  affectedServiceId: z.string().min(1, 'Select an affected service'),
  assigneeId: z.string().min(1, 'Select an assignee'),
})

interface CreateIncidentDialogProps {
  open: boolean
  services: Service[]
  users: User[]
  onClose: () => void
  onSubmit: (input: CreateIncidentInput) => void
}

export default function CreateIncidentDialog({
  open,
  services,
  users,
  onClose,
  onSubmit,
}: CreateIncidentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateIncidentInput>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      affectedServiceId: '',
      assigneeId: '',
    },
  })

  if (!open) {
    return null
  }

  const submit = handleSubmit((data) => {
    const parsed = createIncidentSchema.safeParse(data)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateIncidentInput
        setError(field, { message: issue.message })
      })
      return
    }

    onSubmit(parsed.data)
    reset()
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
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={onClose}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4 px-5 py-5">
            <Field label="Title" error={errors.title?.message}>
              <input
                {...register('title')}
                className={inputClass(!!errors.title)}
                placeholder="Brief incident title"
              />
            </Field>

            <Field label="Description" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                className={cn(inputClass(!!errors.description), 'resize-none')}
                placeholder="Describe the incident impact and symptoms"
              />
            </Field>

            <Field label="Priority" error={errors.priority?.message}>
              <select {...register('priority')} className={inputClass(!!errors.priority)}>
                {(Object.keys(incidentPriorityLabels) as IncidentPriority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {incidentPriorityLabels[priority]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Affected Service" error={errors.affectedServiceId?.message}>
              <select {...register('affectedServiceId')} className={inputClass(!!errors.affectedServiceId)}>
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Assignee" error={errors.assigneeId?.message}>
              <select {...register('assigneeId')} className={inputClass(!!errors.assigneeId)}>
                <option value="">Select an engineer</option>
                {users
                  .filter((user) => user.role !== 'viewer')
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </Field>

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
                className="rounded-lg bg-pulse-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pulse-700 disabled:opacity-60"
              >
                Create Incident
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
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:outline-none',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-200 focus:border-pulse-500 focus:ring-pulse-500/20',
  )
}
