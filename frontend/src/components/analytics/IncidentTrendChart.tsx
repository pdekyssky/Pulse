/**
 * Bar chart showing incident volume trends.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { IncidentTrendDataPoint } from '../../types/analytics.ts'
import { chartColors, chartTooltipStyle } from '../../lib/chart-config.ts'
import ChartCard from './ChartCard.tsx'

interface IncidentTrendChartProps {
  data: IncidentTrendDataPoint[]
}

export default function IncidentTrendChart({ data }: IncidentTrendChartProps) {
  return (
    <ChartCard
      title="Incident Trends"
      description="Incidents created each day, including critical volume and resolutions."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="total" name="Total" fill={chartColors.pulse} radius={[4, 4, 0, 0]} />
            <Bar dataKey="critical" name="Critical" fill={chartColors.red} radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="resolved"
              name="Resolved"
              fill={chartColors.green}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
