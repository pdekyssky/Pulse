/**
 * Line chart showing uptime trends over time.
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { UptimeDataPoint } from '../../types/analytics.ts'
import { chartColors, chartTooltipStyle } from '../../lib/chart-config.ts'
import ChartCard from './ChartCard.tsx'

interface UptimeChartProps {
  data: UptimeDataPoint[]
}

export default function UptimeChart({ data }: UptimeChartProps) {
  return (
    <ChartCard
      title="Service Health"
      description="Overall platform uptime over the selected period."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[90, 100]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, 'Uptime']}
            />
            <Line
              type="monotone"
              dataKey="uptime"
              name="Uptime"
              stroke={chartColors.pulse}
              strokeWidth={2}
              dot={{ r: 3, fill: chartColors.pulse }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
