/**
 * Mock incident records with timelines, logs, and comments.
 */

import type { Incident } from '../types/incident.ts'

const event = (
  id: string,
  timestamp: string,
  type: Incident['timeline'][number]['type'],
  message: string,
  userId?: string,
) => ({ id, timestamp, type, message, userId })

export const mockIncidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'Database cluster unreachable',
    description:
      'Primary PostgreSQL cluster is not accepting connections. Failover to replica has not completed.',
    status: 'investigating',
    priority: 'critical',
    startedAt: '2026-08-12T06:12:00Z',
    duration: '51m',
    assigneeId: 'user-2',
    affectedServiceIds: ['svc-database', 'svc-user', 'svc-payment'],
    timeline: [
      event('evt-001-1', '2026-08-12T06:12:00Z', 'status_change', 'Incident detected.', 'user-3'),
      event('evt-001-2', '2026-08-12T06:13:00Z', 'status_change', 'Incident created.', 'user-3'),
      event('evt-001-3', '2026-08-12T06:14:00Z', 'assignment', 'Assigned to Sarah Chen.', 'user-1'),
      event('evt-001-4', '2026-08-12T06:17:00Z', 'status_change', 'Investigation started.', 'user-2'),
      event('evt-001-5', '2026-08-12T06:35:00Z', 'escalation', 'Escalated to Infrastructure on-call. Failover initiated.', 'user-2'),
      event('evt-001-6', '2026-08-12T06:45:00Z', 'status_change', 'Mitigation deployed — read traffic routed to replica.', 'user-2'),
    ],
    logs: [
      { id: 'log-001-1', timestamp: '2026-08-12T06:12:00Z', level: 'error', message: 'Connection pool exhausted on primary cluster.' },
      { id: 'log-001-2', timestamp: '2026-08-12T06:35:00Z', level: 'warn', message: 'Failover initiated to read replica.' },
      { id: 'log-001-3', timestamp: '2026-08-12T06:45:00Z', level: 'info', message: 'Traffic rerouted to replica endpoint.' },
    ],
    comments: [
      { id: 'cmt-001-1', timestamp: '2026-08-12T06:48:00Z', userId: 'user-2', content: 'Replica promotion in progress. ETA 15 minutes.' },
    ],
  },
  {
    id: 'inc-002',
    title: 'Elevated payment processing latency',
    description:
      'Payment Service p95 response time exceeds 500ms. Checkout completion rate dropped 12%.',
    status: 'monitoring',
    priority: 'high',
    startedAt: '2026-08-12T04:30:00Z',
    duration: '2h 33m',
    assigneeId: 'user-4',
    affectedServiceIds: ['svc-payment'],
    timeline: [
      event('evt-002-1', '2026-08-12T04:30:00Z', 'status_change', 'Incident detected.', 'user-3'),
      event('evt-002-2', '2026-08-12T04:31:00Z', 'status_change', 'Incident created.', 'user-3'),
      event('evt-002-3', '2026-08-12T04:34:00Z', 'assignment', 'Assigned to Elena Rodriguez.', 'user-1'),
      event('evt-002-4', '2026-08-12T04:37:00Z', 'status_change', 'Investigation started.', 'user-4'),
      event('evt-002-5', '2026-08-12T05:05:00Z', 'status_change', 'Root cause identified — third-party payment provider rate limiting.', 'user-4'),
      event('evt-002-6', '2026-08-12T05:40:00Z', 'status_change', 'Mitigation deployed — circuit breaker enabled.', 'user-4'),
    ],
    logs: [
      { id: 'log-002-1', timestamp: '2026-08-12T04:30:00Z', level: 'warn', message: 'p95 latency exceeded 200ms threshold.' },
      { id: 'log-002-2', timestamp: '2026-08-12T05:05:00Z', level: 'info', message: 'Provider rate limit headers detected in responses.' },
    ],
    comments: [
      { id: 'cmt-002-1', timestamp: '2026-08-12T05:40:00Z', userId: 'user-4', content: 'Retry queue backlog growing. Implementing circuit breaker.' },
    ],
  },
  {
    id: 'inc-003',
    title: 'Background job queue backlog',
    description:
      'Worker queue depth exceeded 10,000 jobs. Email notifications and exports delayed.',
    status: 'investigating',
    priority: 'medium',
    startedAt: '2026-08-11T22:00:00Z',
    duration: '8h 3m',
    assigneeId: 'user-6',
    affectedServiceIds: ['svc-background-worker'],
    timeline: [
      event('evt-003-1', '2026-08-11T22:00:00Z', 'status_change', 'Incident detected.', 'user-3'),
      event('evt-003-2', '2026-08-11T22:01:00Z', 'status_change', 'Incident created.', 'user-3'),
      event('evt-003-3', '2026-08-11T22:04:00Z', 'assignment', 'Assigned to Amira Hassan.', 'user-1'),
      event('evt-003-4', '2026-08-11T22:07:00Z', 'status_change', 'Investigation started.', 'user-6'),
      event('evt-003-5', '2026-08-11T23:15:00Z', 'status_change', 'Scaled worker pool from 4 to 12 instances.', 'user-6'),
    ],
    logs: [
      { id: 'log-003-1', timestamp: '2026-08-11T22:00:00Z', level: 'warn', message: 'Queue depth at 10,247 pending jobs.' },
      { id: 'log-003-2', timestamp: '2026-08-11T23:15:00Z', level: 'info', message: 'Autoscaling triggered for worker pool.' },
    ],
    comments: [],
  },
  {
    id: 'inc-004',
    title: 'Auth token refresh failures',
    description: 'Intermittent 503 errors on token refresh endpoint affecting mobile clients.',
    status: 'resolved',
    priority: 'high',
    startedAt: '2026-08-10T14:20:00Z',
    duration: '1h 45m',
    assigneeId: 'user-2',
    affectedServiceIds: ['svc-auth', 'svc-api-gateway'],
    timeline: [
      event('evt-004-1', '2026-08-10T14:20:00Z', 'status_change', 'Incident detected.', 'user-3'),
      event('evt-004-2', '2026-08-10T14:21:00Z', 'status_change', 'Incident created.', 'user-3'),
      event('evt-004-3', '2026-08-10T14:24:00Z', 'assignment', 'Assigned to Sarah Chen.', 'user-1'),
      event('evt-004-4', '2026-08-10T15:10:00Z', 'status_change', 'Root cause identified — misconfigured load balancer health check.', 'user-2'),
      event('evt-004-5', '2026-08-10T16:05:00Z', 'resolution', 'Incident resolved. Error rate returned to baseline.', 'user-2'),
    ],
    logs: [
      { id: 'log-004-1', timestamp: '2026-08-10T14:20:00Z', level: 'error', message: '503 spike on /auth/refresh endpoint.' },
      { id: 'log-004-2', timestamp: '2026-08-10T16:05:00Z', level: 'info', message: 'Health check config updated successfully.' },
    ],
    comments: [],
  },
  {
    id: 'inc-005',
    title: 'Scheduled maintenance — API Gateway',
    description: 'Planned certificate rotation caused brief connectivity blips for external clients.',
    status: 'resolved',
    priority: 'low',
    startedAt: '2026-08-09T02:00:00Z',
    duration: '45m',
    assigneeId: 'user-1',
    affectedServiceIds: ['svc-api-gateway'],
    timeline: [
      event('evt-005-1', '2026-08-09T02:00:00Z', 'status_change', 'Maintenance window started.', 'user-1'),
      event('evt-005-2', '2026-08-09T02:45:00Z', 'resolution', 'Certificate rotation complete. All health checks passing.', 'user-1'),
    ],
    logs: [
      { id: 'log-005-1', timestamp: '2026-08-09T02:00:00Z', level: 'info', message: 'TLS certificate rotation initiated.' },
    ],
    comments: [],
  },
  {
    id: 'inc-006',
    title: 'User Service cache miss rate elevated',
    description: 'Redis cache miss rate increased to 34%, causing higher database load and slower profile reads.',
    status: 'identified',
    priority: 'medium',
    startedAt: '2026-08-12T03:15:00Z',
    duration: '3h 48m',
    assigneeId: 'user-2',
    affectedServiceIds: ['svc-user'],
    timeline: [
      event('evt-006-1', '2026-08-12T03:15:00Z', 'status_change', 'Incident detected.', 'user-3'),
      event('evt-006-2', '2026-08-12T03:16:00Z', 'status_change', 'Incident created.', 'user-3'),
      event('evt-006-3', '2026-08-12T03:20:00Z', 'assignment', 'Assigned to Sarah Chen.', 'user-1'),
      event('evt-006-4', '2026-08-12T03:45:00Z', 'status_change', 'Root cause identified — cache TTL misconfiguration after deploy.', 'user-2'),
    ],
    logs: [
      { id: 'log-006-1', timestamp: '2026-08-12T03:15:00Z', level: 'warn', message: 'Cache miss rate at 34% (baseline 12%).' },
    ],
    comments: [
      { id: 'cmt-006-1', timestamp: '2026-08-12T04:00:00Z', userId: 'user-2', content: 'Rolling back TTL config in next deploy window.' },
    ],
  },
  {
    id: 'inc-007',
    title: 'API Gateway rate limit misconfiguration',
    description: 'Overly aggressive rate limits blocking legitimate partner API traffic.',
    status: 'investigating',
    priority: 'high',
    startedAt: '2026-08-12T05:20:00Z',
    duration: '1h 43m',
    assigneeId: 'user-4',
    affectedServiceIds: ['svc-api-gateway'],
    timeline: [
      event('evt-007-1', '2026-08-12T05:20:00Z', 'status_change', 'Incident detected.', 'user-3'),
      event('evt-007-2', '2026-08-12T05:21:00Z', 'status_change', 'Incident created.', 'user-3'),
      event('evt-007-3', '2026-08-12T05:24:00Z', 'assignment', 'Assigned to Elena Rodriguez.', 'user-1'),
      event('evt-007-4', '2026-08-12T05:27:00Z', 'status_change', 'Investigation started.', 'user-4'),
    ],
    logs: [
      { id: 'log-007-1', timestamp: '2026-08-12T05:20:00Z', level: 'warn', message: '429 responses spiking for partner API keys.' },
    ],
    comments: [],
  },
  {
    id: 'inc-008',
    title: 'Authentication Service memory pressure',
    description: 'Memory utilization at 87% on auth-service-3 pod, causing intermittent restarts.',
    status: 'monitoring',
    priority: 'medium',
    startedAt: '2026-08-11T18:00:00Z',
    duration: '12h 3m',
    assigneeId: 'user-4',
    affectedServiceIds: ['svc-auth'],
    timeline: [
      event('evt-008-1', '2026-08-11T18:00:00Z', 'status_change', 'Incident detected.', 'user-3'),
      event('evt-008-2', '2026-08-11T18:05:00Z', 'assignment', 'Assigned to Elena Rodriguez.', 'user-1'),
      event('evt-008-3', '2026-08-11T19:30:00Z', 'status_change', 'Memory limits increased. Pod restabilized.', 'user-4'),
      event('evt-008-4', '2026-08-12T00:00:00Z', 'status_change', 'Moved to monitoring.', 'user-4'),
    ],
    logs: [
      { id: 'log-008-1', timestamp: '2026-08-11T18:00:00Z', level: 'warn', message: 'Memory at 87% on auth-service-3.' },
      { id: 'log-008-2', timestamp: '2026-08-11T19:30:00Z', level: 'info', message: 'Pod memory limit raised to 2Gi.' },
    ],
    comments: [],
  },
]
