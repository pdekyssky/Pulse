/**
 * Client-side route definitions for all Pulse dashboard pages.
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute.tsx'
import PublicRoute from '../components/auth/PublicRoute.tsx'
import AppLayout from '../components/layout/AppLayout'
import AlertsPage from '../pages/AlertsPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import IncidentsPage from '../pages/IncidentsPage'
import LoginPage from '../pages/LoginPage'
import NotificationsPage from '../pages/NotificationsPage'
import OverviewPage from '../pages/OverviewPage'
import ReportsPage from '../pages/ReportsPage'
import ServicesPage from '../pages/ServicesPage'
import SettingsPage from '../pages/SettingsPage'
import TeamPage from '../pages/TeamPage'
import TimelinePage from '../pages/TimelinePage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
