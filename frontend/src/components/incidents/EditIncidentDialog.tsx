/**
 * Modal form for editing incident title and description via PATCH.
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'

import type { Incident } from '../../types/incident.ts'
import { formatIncidentId } from '../../lib/format.ts'
import { cn } from '../../lib/utils.ts'

const editIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
})

export interface EditIncidentInput {
  title: string
  description: string
}

interface EditIncidentDialogProps {
  incident: Incident | null
  open: boolean
  onClose: () => void
  onSubmit: (input: EditIncidentInput) => void | Promise<void>
  isPending?: boolean
  submitError?: string | null
}

export default function EditIncidentDialog({
  incident,
  open,
  onClose,
  onSubmit,
  isPending = false,
  submitError = null,
}: EditIncidentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditIncidentInput>({
    defaultValues: {
      title: '',
      description: '',
    },
  })

  useEffect(() => {
    if (open && incident) {
      reset({
        title: incident.title,
        description: incident.description,
      })
    }
  }, [incident, open, reset])

  if (!open || !incident) {
    return null
  }

  const pending = isSubmitting || isPending

  const submit = handleSubmit(async (data) => {
    const parsed = editIncidentSchema.safeParse(data)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof EditIncidentInput
        setError(field, { message: issue.message })
      })
      return
    }

    await onSubmit(parsed.data)
  })

  return (
    <>
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onClose}
        disabled={pending}
      />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-incident-title"
          className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 id="edit-incident-title" className="text-lg font-semibold text-gray-900">
              Edit {formatIncidentId(incident.id)}
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
              />
            </Field>

            <Field label="Description" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={4}
                disabled={pending}
                className={cn(inputClass(!!errors.description), 'resize-none')}
              />
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
                {pending ? 'Saving...' : 'Save changes'}
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
