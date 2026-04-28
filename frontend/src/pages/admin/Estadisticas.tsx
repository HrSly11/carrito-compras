import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/services/api';
import { formatCurrency } from '@/utils/formatters';

interface MonthlyTrend {
  mes: string;
  ventas: number;
  promedio3m: number;
}

interface HeatmapData {
  dia: string;
  [hora: string]: string | number;
}

interface ABCProduct {
  producto: string;
  revenue: number;
  revenuePercent: number;
  cumulativePercent: number;
  clase: 'A' | 'B' | 'C';
}

interface RFMData {
  segmento: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface CohortData {
  mes: string;
  [mesAdquisicion: string]: string | number;
}

interface TicketSegment {
  segmento: string;
  promedio: number;
  cantidad: number;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function MonthlyTrendChart({ data }: { data: MonthlyTrend[] }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="ventas"
            stroke={COLORS.primary}
            strokeWidth={2}
            name="Ventas"
            dot={{ fill: COLORS.primary, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="promedio3m"
            stroke={COLORS.success}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Promedio 3 meses"
            dot={{ fill: COLORS.success, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SalesHeatmap({ data }: { data: HeatmapData[] }) {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const hours = ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

  const getHeatmapColor = (value: number, max: number) => {
    if (!value || value === 0) return '#f3f4f6';
    const intensity = Math.min(value / max, 1);
    if (intensity > 0.7) return COLORS.success;
    if (intensity > 0.4) return COLORS.warning;
    return '#fef3c7';
  };

  const maxValue = Math.max(...data.map((d) => Math.max(...hours.map((h) => Number(d[h]) || 0))));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-1 mb-2">
          <div className="w-16" />
          {hours.map((h) => (
            <div key={h} className="flex-1 text-center text-xs text-muted-foreground">
              {h}
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dayData = data.find((d) => d.dia === day);
          return (
            <div key={day} className="flex gap-1 mb-1">
              <div className="w-16 text-xs flex items-center">{day}</div>
              {hours.map((h) => {
                const value = dayData ? Number(dayData[h]) || 0 : 0;
                return (
                  <div
                    key={h}
                    className="flex-1 h-8 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: getHeatmapColor(value, maxValue) }}
                    title={`${day} ${h}:00 - ${value} ventas`}
                  >
                    {value > 0 ? value : ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ABCAnalysisTable({ data }: { data: ABCProduct[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left py-2 px-3 font-medium">Producto</th>
            <th className="text-right py-2 px-3 font-medium">Ingresos</th>
            <th className="text-right py-2 px-3 font-medium">% Ingresos</th>
            <th className="text-right py-2 px-3 font-medium">% Acumulado</th>
            <th className="text-center py-2 px-3 font-medium">Clase</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((product, idx) => (
            <tr key={idx} className="border-b">
              <td className="py-2 px-3 truncate max-w-[200px]">{product.producto}</td>
              <td className="py-2 px-3 text-right">{formatCurrency(product.revenue)}</td>
              <td className="py-2 px-3 text-right">{product.revenuePercent.toFixed(1)}%</td>
              <td className="py-2 px-3 text-right">{product.cumulativePercent.toFixed(1)}%</td>
              <td className="py-2 px-3 text-center">
                <Badge
                  className={
                    product.clase === 'A'
                      ? 'bg-green-500/10 text-green-600 border-0'
                      : product.clase === 'B'
                      ? 'bg-yellow-500/10 text-yellow-600 border-0'
                      : 'bg-gray-500/10 text-gray-600 border-0'
                  }
                >
                  {product.clase}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RFMSegmentation({ data }: { data: RFMData[] }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="segmento" type="category" tick={{ fontSize: 12 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="cantidad" name="Clientes" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CohortRetentionTable({ data }: { data: CohortData[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">No hay datos disponibles</p>;

  const cohorts = Object.keys(data[0] || {}).filter((k) => k !== 'mes');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left py-2 px-2 font-medium">Cohort</th>
            {cohorts.map((c) => (
              <th key={c} className="text-center py-2 px-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b">
              <td className="py-1 px-2 font-medium">{row.mes}</td>
              {cohorts.map((c) => {
                const value = row[c] as number;
                return (
                  <td
                    key={c}
                    className="text-center py-1 px-2"
                    style={{
                      backgroundColor: value ? `rgba(59, 130, 246, ${value / 100})` : '#f3f4f6',
                      color: value && value > 50 ? 'white' : 'inherit',
                    }}
                  >
                    {value ? `${value}%` : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketDistributionChart({ data }: { data: TicketSegment[] }) {
  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="segmento" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="promedio" name="Ticket Promedio" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Estadisticas() {
  const [periodo, setPeriodo] = useState('30d');
  const [customRange, setCustomRange] = useState({
    desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0],
  });

  const getDateRange = () => {
    if (periodo === 'custom') return customRange;
    const days = parseInt(periodo);
    const desde = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { desde, hasta: new Date().toISOString().split('T')[0] };
  };

  const { data: monthlyTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['estadisticas', 'monthlyTrend', periodo],
    queryFn: () =>
      api
        .get<MonthlyTrend[]>('/estadisticas/ventas-mensuales', { params: getDateRange() })
        .then((res) => res.data),
  });

  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: ['estadisticas', 'heatmap', periodo],
    queryFn: () =>
      api
        .get<HeatmapData[]>('/estadisticas/ventas-calor', { params: getDateRange() })
        .then((res) => res.data),
  });

  const { data: abcData, isLoading: abcLoading } = useQuery({
    queryKey: ['estadisticas', 'abc', periodo],
    queryFn: () =>
      api
        .get<ABCProduct[]>('/estadisticas/abc', { params: getDateRange() })
        .then((res) => res.data),
  });

  const { data: rfmData, isLoading: rfmLoading } = useQuery({
    queryKey: ['estadisticas', 'rfm', periodo],
    queryFn: () =>
      api.get<RFMData[]>('/estadisticas/rfm').then((res) => res.data),
  });

  const { data: cohortData, isLoading: cohortLoading } = useQuery({
    queryKey: ['estadisticas', 'cohort', periodo],
    queryFn: () =>
      api
        .get<CohortData[]>('/estadisticas/cohort-retention', { params: getDateRange() })
        .then((res) => res.data),
  });

  const { data: ticketData, isLoading: ticketLoading } = useQuery({
    queryKey: ['estadisticas', 'ticket', periodo],
    queryFn: () =>
      api
        .get<TicketSegment[]>('/estadisticas/ticket-segmento', { params: getDateRange() })
        .then((res) => res.data),
  });

  const { data: abandonoData } = useQuery({
    queryKey: ['estadisticas', 'abandono', periodo],
    queryFn: () =>
      api.get<{ periodo: string; tasa: number }[]>('/estadisticas/abandono-carrito').then((res) => res.data),
  });

  const { data: correlacionData } = useQuery({
    queryKey: ['estadisticas', 'correlacion', periodo],
    queryFn: () =>
      api
        .get<{ descuento: number; volumen: number }[]>('/estadisticas/correlacion-descuentos')
        .then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas Descriptivas</h1>
          <p className="text-muted-foreground">Análisis avanzado de métricas de negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="365d">Último año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {periodo === 'custom' && (
            <>
              <Input
                type="date"
                className="w-[140px]"
                value={customRange.desde}
                onChange={(e) => setCustomRange({ ...customRange, desde: e.target.value })}
              />
              <Input
                type="date"
                className="w-[140px]"
                value={customRange.hasta}
                onChange={(e) => setCustomRange({ ...customRange, hasta: e.target.value })}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tendencia Ventas</p>
                <p className="text-lg font-bold">
                  {monthlyTrend && monthlyTrend.length >= 2
                    ? ((monthlyTrend[monthlyTrend.length - 1].ventas - monthlyTrend[monthlyTrend.length - 2].ventas) /
                        monthlyTrend[monthlyTrend.length - 2].ventas *
                        100)
                        .toFixed(1)
                    : '0'}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes Activos (RFM)</p>
                <p className="text-lg font-bold">
                  {rfmData?.reduce((sum, r) => sum + (r.segmento !== 'inactivo' ? r.cantidad : 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <ShoppingCart className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Abandono Carrito</p>
                <p className="text-lg font-bold">
                  {abandonoData?.[0]?.tasa ? `${abandonoData[0].tasa.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productos Clase A</p>
                <p className="text-lg font-bold">
                  {abcData?.filter((p) => p.clase === 'A').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ventas Mensuales</CardTitle>
            <CardDescription>Con promedio móvil de 3 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <MonthlyTrendChart data={monthlyTrend || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapa de Calor - Ventas por Día y Hora</CardTitle>
            <CardDescription>Distribución temporal de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            {heatmapLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <SalesHeatmap data={heatmapData || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análisis ABC - Clasificación de Productos por Ingresos</CardTitle>
          <CardDescription>
            Clase A: 80% superior, Clase B: siguiente 15%, Clase C: 5% restante
          </CardDescription>
        </CardHeader>
        <CardContent>
          {abcLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ABCAnalysisTable data={abcData || []} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Segmentación RFM</CardTitle>
            <CardDescription>Recencia, Frecuencia y Valor Monetario</CardDescription>
          </CardHeader>
          <CardContent>
            {rfmLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <RFMSegmentation data={rfmData || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Promedio por Segmento</CardTitle>
            <CardDescription>Distribución del promedio de compra</CardDescription>
          </CardHeader>
          <CardContent>
            {ticketLoading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <TicketDistributionChart data={ticketData || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de Retención de Cohortes</CardTitle>
          <CardDescription>Porcentaje de clientes que regresan mes a mes</CardDescription>
        </CardHeader>
        <CardContent>
          {cohortLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <CohortRetentionTable data={cohortData || []} />
          )}
        </CardContent>
      </Card>

      {correlacionData && correlacionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Correlación Descuento vs Volumen</CardTitle>
            <CardDescription>Análisis del impacto de descuentos en el volumen de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="descuento"
                    type="number"
                    name="Descuento %"
                    tick={{ fontSize: 12 }}
                    domain={[0, 'auto']}
                  />
                  <YAxis
                    dataKey="volumen"
                    type="number"
                    name="Volumen"
                    tick={{ fontSize: 12 }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="text-sm">
                              Descuento: {payload[0].payload.descuento}%
                            </p>
                            <p className="text-sm">Volumen: {payload[0].payload.volumen}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={correlacionData} fill={COLORS.primary} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
