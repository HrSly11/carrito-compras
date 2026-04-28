import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps, Cell } from 'recharts'
import { formatNumber } from '../../utils/formatters'

interface ProductDataPoint {
  nombre: string
  cantidad: number
}

interface TopProductsChartProps {
  data: ProductDataPoint[]
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          {label}
        </p>
        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
          {formatNumber(payload[0].value as number)} unidades
        </p>
      </div>
    )
  }
  return null
}

export const TopProductsChart = ({ data }: TopProductsChartProps) => {
  const chartData = data.slice(0, 10).map((item, index) => ({
    ...item,
    index,
  }))

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            width={115}
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="cantidad"
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`hsl(${160 + index * 8}, 70%, 45%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
