/**
 * Modal form for adding or editing a team member.
 */

import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'

import type { UserFormInput, UserRole, UserStatus } from '../../types/user.ts'
import { userRoleLabels, userStatusLabels } from '../../types/user.ts'
import { cn } from '../../lib/utils.ts'

const memberFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['admin', 'engineer', 'responder', 'viewer']),
  status: z.enum(['active', 'inactive', 'invited']),
})

interface MemberFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: UserFormInput
  onClose: () => void
  onSubmit: (input: UserFormInput) => void
}

const defaultValues: UserFormInput = {
  name: '',
  email: '',
  role: 'engineer',
  status: 'active',
}

export default function MemberFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: MemberFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormInput>({
    defaultValues: initialValues ?? defaultValues,
    values: initialValues,
  })

  if (!open) {
    return null
  }

  const submit = handleSubmit((data) => {
    const parsed = memberFormSchema.safeParse(data)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof UserFormInput
        setError(field, { message: issue.message })
      })
      return
    }

    onSubmit(parsed.data)
    reset(defaultValues)
    onClose()
  })

  const title = mode === 'create' ? 'Add Member' : 'Edit Member'
  const submitLabel = mode === 'create' ? 'Add Member' : 'Save Changes'

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
          aria-labelledby="member-form-title"
          className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 id="member-form-title" className="text-lg font-semibold text-gray-900">
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
                placeholder="e.g. Jane Smith"
              />
            </FormField>

            <FormField label="Email" error={errors.email?.message}>
              <input
                type="email"
                {...register('email')}
                className={inputClassName(!!errors.email)}
                placeholder="jane.smith@pulse.io"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Role" error={errors.role?.message}>
                <select {...register('role')} className={inputClassName(!!errors.role)}>
                  {(Object.entries(userRoleLabels) as Array<[UserRole, string]>).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </FormField>

              <FormField label="Status" error={errors.status?.message}>
                <select {...register('status')} className={inputClassName(!!errors.status)}>
                  {(Object.entries(userStatusLabels) as Array<[UserStatus, string]>).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </FormField>
            </div>

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
