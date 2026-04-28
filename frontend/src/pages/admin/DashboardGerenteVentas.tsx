import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, ShoppingCart, Package, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ordenService from '@/services/orden.service';
import { formatCurrency, formatDate } from '@/lib/utils';

type DateRange = '7d' | '30d' | '90d';

function StatCard({ title, value, subtitle, change, changeType, icon: Icon, color }: {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className={`relative overflow-hidden shadow-md`}>
      <CardContent className="p-6">
        <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500`} />
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'increase' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{change}% vs período anterior</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardGerenteVentas() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const { data: ordenesData } = useQuery({
    queryKey: ['ordenesGerenteVentas', dateRange],
    queryFn: () => ordenService.getAllOrdenes({ limit: 100 }),
  });

  const ordenes = ordenesData?.data || [];

  const now = new Date();
  let fechaDesde = new Date();
  switch (dateRange) {
    case '7d': fechaDesde.setDate(now.getDate() - 7); break;
    case '30d': fechaDesde.setDate(now.getDate() - 30); break;
    case '90d': fechaDesde.setDate(now.getDate() - 90); break;
  }

  const ordenesEnRango = ordenes.filter((o: any) => new Date(o.createdAt) >= fechaDesde);
  const ordenesCompletadas = ordenesEnRango.filter((o: any) => o.estado === 'pagada' || o.estado === 'en_proceso' || o.estado === 'enviada' || o.estado === 'entregada');
  const ordenesPendientes = ordenesEnRango.filter((o: any) => o.estado === 'pendiente_pago');

  const ventasTotales = ordenesCompletadas.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const ticketPromedio = ordenesCompletadas.length > 0 ? ventasTotales / ordenesCompletadas.length : 0;

  const ordenesPorEstado = {
    pagada: ordenesEnRango.filter((o: any) => o.estado === 'pagada').length,
    pendiente_pago: ordenesEnRango.filter((o: any) => o.estado === 'pendiente_pago').length,
    cancelada: ordenesEnRango.filter((o: any) => o.estado === 'cancelado').length,
  };

  const totalOrdenes = ordenesEnRango.length;
  const tasaConversión = totalOrdenes > 0 ? Math.round((ordenesCompletadas.length / totalOrdenes) * 100) : 0;

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Gerente de Ventas</h1>
          <p className="text-muted-foreground mt-1">Análisis detallado de métricas de ventas</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[180px] bg-white">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Seleccionar rango" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas Totales"
          value={formatCurrency(ventasTotales)}
          subtitle={`En ${dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} días`}
          change={12}
          changeType="increase"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Ticket Promedio"
          value={formatCurrency(ticketPromedio)}
          subtitle="Por orden completada"
          change={5}
          changeType="increase"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Tasa Conversión"
          value={`${tasaConversión}%`}
          subtitle={`${ordenesCompletadas.length} de ${totalOrdenes} órdenes`}
          change={-2}
          changeType="decrease"
          icon={ShoppingCart}
          color="purple"
        />
        <StatCard
          title="Órdenes Pendientes"
          value={ordenesPendientes.length.toString()}
          subtitle="Requieren atención"
          icon={Package}
          color="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="bg-emerald-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-emerald-800">
              <DollarSign className="h-5 w-5" />
              Resumen de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Total de Órdenes</p>
                  <p className="text-2xl font-bold text-emerald-900">{totalOrdenes}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Completadas</p>
                  <p className="text-xl font-bold text-green-600">{ordenesPorEstado.completada}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center border border-green-100">
                  <p className="text-2xl font-bold text-green-700">{ordenesPorEstado.completada}</p>
                  <p className="text-xs text-green-600 font-medium">Completadas</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center border border-yellow-100">
                  <p className="text-2xl font-bold text-yellow-700">{ordenesPorEstado.pendiente}</p>
                  <p className="text-xs text-yellow-600 font-medium">Pendientes</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center border border-red-100">
                  <p className="text-2xl font-bold text-red-700">{ordenesPorEstado.cancelada}</p>
                  <p className="text-xs text-red-600 font-medium">Canceladas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-blue-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-blue-800">
              <TrendingUp className="h-5 w-5" />
              Rendimiento de Conversión
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Tasa de conversión</span>
                  <span className="font-bold">{tasaConversión}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                    style={{ width: `${tasaConversión}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Órdenes completadas</p>
                  <p className="text-xl font-bold">{ordenesPorEstado.completada}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Órdenes canceladas</p>
                  <p className="text-xl font-bold">{ordenesPorEstado.cancelada}</p>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-700 font-medium">Ingreso promedio por día</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(ordenesCompletadas.length > 0 ? ventasTotales / (
                    dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
                  ) : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            Órdenes del Período
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Número</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Cliente</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Fecha</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Total</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ordenesEnRango.slice(0, 10).map((orden: any) => (
                  <tr key={orden.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-mono text-sm font-medium">{orden.numero}</td>
                    <td className="py-4 px-6">
                      <p className="font-medium">{orden.usuario?.nombre || 'Cliente'}</p>
                      <p className="text-xs text-muted-foreground">{orden.usuario?.email}</p>
                    </td>
                    <td className="py-4 px-6 text-sm">{formatDate(orden.createdAt)}</td>
                    <td className="py-4 px-6 font-bold">{formatCurrency(orden.total)}</td>
                    <td className="py-4 px-6">
                      <Badge variant={
                        orden.estado === 'completada' ? 'default' :
                        orden.estado === 'pendiente' ? 'secondary' : 'destructive'
                      }>
                        {orden.estado}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {ordenesEnRango.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      No hay órdenes en este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}