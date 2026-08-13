/**
 * Maps service categories to Lucide icon components.
 */

import {
  CreditCard,
  Database,
  Server,
  Shield,
  Users,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const serviceIcons: Record<string, LucideIcon> = {
  'svc-api-gateway': Server,
  'svc-auth': Shield,
  'svc-payment': CreditCard,
  'svc-user': Users,
  'svc-database': Database,
  'svc-background-worker': Workflow,
}

export function getServiceIcon(serviceId: string): LucideIcon {
  return serviceIcons[serviceId] ?? Server
}
