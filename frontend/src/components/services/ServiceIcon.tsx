/**
 * Renders the Lucide icon associated with a service.
 */

import { createElement } from 'react'
import { Server } from 'lucide-react'

import { serviceIcons } from '../../lib/service-icons.ts'

interface ServiceIconProps {
  serviceId: string
  className?: string
}

export default function ServiceIcon({ serviceId, className }: ServiceIconProps) {
  return createElement(serviceIcons[serviceId] ?? Server, {
    className,
    'aria-hidden': true,
  })
}
