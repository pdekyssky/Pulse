/**
 * Client-side route definitions for all Pulse dashboard pages.
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppLayout from '../components/layout/AppLayout'
import AlertsPage from '../pages/AlertsPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import IncidentsPage from '../pages/IncidentsPage'
import OverviewPage from '../pages/OverviewPage'
import ReportsPage from '../pages/ReportsPage'
import ServicesPage from '../pages/ServicesPage'
import SettingsPage from '../pages/SettingsPage'
import TeamPage from '../pages/TeamPage'
import TimelinePage from '../pages/TimelinePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> }, // Default landing page
      { path: 'overview', element: <OverviewPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
