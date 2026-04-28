import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, TooltipProps } from 'recharts'

interface FunnelDataPoint {
  etapa: string
  valor: number
  color: string
}

interface ConversionFunnelProps {
  data: FunnelDataPoint[]
}

const STAGE_LABELS: Record<string, string> = {
  visitas: 'Visitas',
  carritos: 'Carritos agregados',
  checkouts: 'Iniciaron checkout',
  ventas: 'Ventas completadas',
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as FunnelDataPoint
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          {STAGE_LABELS[data.etapa] || data.etapa}
        </p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {data.valor.toLocaleString('es-MX')}
        </p>
      </div>
    )
  }
  return null
}

export const ConversionFunnel = ({ data }: ConversionFunnelProps) => {
  const maxValue = data[0]?.valor || 1

  const funnelData = data.map((item) => ({
    ...item,
    porcentaje: ((item.valor / maxValue) * 100).toFixed(1),
  }))

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            data={funnelData}
            dataKey="valor"
            nameKey="etapa"
            isAnimationActive
          >
            <LabelList
              position="right"
              fill="#6B7280"
              stroke="none"
              dataKey="porcentaje"
              formatter={(value: string) => `${value}%`}
              className="text-sm font-medium"
            />
            <LabelList
              position="center"
              fill="#FFFFFF"
              stroke="none"
              dataKey="valor"
              formatter={(value: number) => value.toLocaleString('es-MX')}
              className="text-sm font-semibold"
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}
