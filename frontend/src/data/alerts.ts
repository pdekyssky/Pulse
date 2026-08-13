/**
 * Mock alert records linked to services.
 */

import type { Alert } from '../types/alert.ts'

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    title: 'Database connection failures',
    message: 'Connection pool exhausted — 100% of connection attempts failing on primary cluster.',
    severity: 'critical',
    status: 'active',
    serviceId: 'svc-database',
    createdAt: '2026-08-12T06:12:00Z',
  },
  {
    id: 'alert-002',
    title: 'Payment latency threshold exceeded',
    message: 'p95 response time is 312ms, exceeding the 200ms threshold.',
    severity: 'critical',
    status: 'acknowledged',
    serviceId: 'svc-payment',
    createdAt: '2026-08-12T04:30:00Z',
  },
  {
    id: 'alert-003',
    title: 'Worker queue depth high',
    message: 'Background job queue has 10,247 pending jobs (threshold: 5,000).',
    severity: 'warning',
    status: 'acknowledged',
    serviceId: 'svc-background-worker',
    createdAt: '2026-08-11T22:00:00Z',
  },
  {
    id: 'alert-004',
    title: 'API Gateway error rate elevated',
    message: '5xx error rate at 2.3% over the last 5 minutes (threshold: 1%).',
    severity: 'warning',
    status: 'active',
    serviceId: 'svc-api-gateway',
    createdAt: '2026-08-12T06:25:00Z',
  },
  {
    id: 'alert-005',
    title: 'Auth service memory usage high',
    message: 'Memory utilization at 87% on auth-service-3 pod.',
    severity: 'warning',
    status: 'active',
    serviceId: 'svc-auth',
    createdAt: '2026-08-12T05:50:00Z',
  },
  {
    id: 'alert-006',
    title: 'User service cache miss rate',
    message: 'Redis cache miss rate increased to 34% (baseline: 12%).',
    severity: 'info',
    status: 'active',
    serviceId: 'svc-user',
    createdAt: '2026-08-12T03:15:00Z',
  },
  {
    id: 'alert-007',
    title: 'Database replica lag',
    message: 'Read replica replication lag reached 45 seconds.',
    severity: 'warning',
    status: 'resolved',
    serviceId: 'svc-database',
    createdAt: '2026-08-10T18:40:00Z',
  },
  {
    id: 'alert-008',
    title: 'Certificate expiry reminder',
    message: 'API Gateway TLS certificate expires in 14 days.',
    severity: 'info',
    status: 'resolved',
    serviceId: 'svc-api-gateway',
    createdAt: '2026-08-08T09:00:00Z',
  },
]
