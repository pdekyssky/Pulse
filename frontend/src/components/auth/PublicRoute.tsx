/**
 * Redirects authenticated users away from public pages such as login.
 */

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth.ts'

interface PublicRouteProps {
  children: ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading session...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/overview" replace />
  }

  return children
}
