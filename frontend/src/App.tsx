/**
 * Root application shell. Wraps routing with auth, React Query, and incident state.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from './context/AuthProvider.tsx'
import { IncidentsProvider } from './context/IncidentsProvider.tsx'
import { router } from './routes'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IncidentsProvider>
          <RouterProvider router={router} />
        </IncidentsProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
