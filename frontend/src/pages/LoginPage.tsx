/**
 * Login page for Pulse dashboard access.
 */

import { useState } from 'react'
import { Activity } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import Card from '../components/ui/Card.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { ApiError } from '../lib/api/client.ts'
import { cn } from '../lib/utils.ts'
import type { LoginFormInput } from '../types/auth.ts'

const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const redirectPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/overview'

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null)

    const parsed = loginFormSchema.safeParse(data)
    if (!parsed.success) {
      return
    }

    try {
      await login(parsed.data)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message)
        return
      }

      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to sign in. Please try again.',
      )
    }
  })

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-pulse-600">
            <Activity className="size-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Sign in to Pulse</h1>
          <p className="mt-2 text-sm text-gray-500">
            Incident and service management for your team.
          </p>
        </div>

        <Card className="p-6">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20',
                  errors.email ? 'border-red-300' : 'border-gray-300',
                )}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-pulse-500 focus:ring-2 focus:ring-pulse-500/20',
                  errors.password ? 'border-red-300' : 'border-gray-300',
                )}
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-pulse-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pulse-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
