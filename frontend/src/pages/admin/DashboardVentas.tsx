import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ordenService from '@/services/orden.service';
import { formatCurrency, formatDate } from '@/lib/utils';

type DateRange = '7d' | '30d' | '90d';

function KPICard({ title, value, subtitle, icon: Icon, variant = 'default' }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'success';
}) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-yellow-500/10 text-yellow-600',
    success: 'bg-green-500/10 text-green-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${variantStyles[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardVentas() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const { data: ordenesData, isLoading } = useQuery({
    queryKey: ['ordenesVentas'],
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

  const ordenesEnRango = ordenes.filter((o: any) => {
    const fechaOrden = new Date(o.createdAt);
    return fechaOrden >= fechaDesde;
  });

  const ventasTotales = ordenesEnRango
    .filter((o: any) => o.estado === 'completada')
    .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

  const ordenesPendientes = ordenes.filter((o: any) => o.estado === 'pendiente').length;
  const ordenesCompletadas = ordenes.filter((o: any) => o.estado === 'completada').length;
  const ticketPromedio = ordenesCompletadas > 0 ? ventasTotales / ordenesCompletadas : 0;

  const ordenesPorEstado = [
    { estado: 'pendiente', cantidad: ordenes.filter((o: any) => o.estado === 'pendiente').length, color: '#eab308' },
    { estado: 'completada', cantidad: ordenes.filter((o: any) => o.estado === 'completada').length, color: '#22c55e' },
    { estado: 'cancelada', cantidad: ordenes.filter((o: any) => o.estado === 'cancelada').length, color: '#ef4444' },
  ].filter(e => e.cantidad > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Ventas</h1>
          <p className="text-muted-foreground">Métricas de ventas y rendimiento</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[180px]">
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
        <KPICard
          title="Ventas Totales"
          value={formatCurrency(ventasTotales)}
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Órdenes Pendientes"
          value={ordenesPendientes}
          icon={ShoppingCart}
          variant="warning"
        />
        <KPICard
          title="Ticket Promedio"
          value={formatCurrency(ticketPromedio)}
          icon={TrendingUp}
        />
        <KPICard
          title="Órdenes Completadas"
          value={ordenesCompletadas}
          icon={Users}
          variant="success"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordenesPorEstado.map((item) => (
                <div key={item.estado} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium capitalize">{item.estado}</span>
                  </div>
                  <span className="font-bold">{item.cantidad}</span>
                </div>
              ))}
              {ordenesPorEstado.length === 0 && (
                <p className="text-center text-muted-foreground">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total órdenes</span>
                <span className="font-bold">{ordenesEnRango.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Órdenes completadas</span>
                <span className="font-bold text-green-600">{ordenesCompletadas}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Tasa completación</span>
                <span className="font-bold">
                  {ordenesEnRango.length > 0
                    ? Math.round((ordenesCompletadas / ordenesEnRango.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Número</th>
                  <th className="text-left py-3 px-2 font-medium">Cliente</th>
                  <th className="text-left py-3 px-2 font-medium">Fecha</th>
                  <th className="text-left py-3 px-2 font-medium">Total</th>
                  <th className="text-left py-3 px-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.slice(0, 10).map((orden: any) => (
                  <tr key={orden.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-mono text-xs">{orden.numero}</td>
                    <td className="py-3 px-2">
                      <p className="font-medium">{orden.usuario?.nombre}</p>
                      <p className="text-xs text-muted-foreground">{orden.usuario?.email}</p>
                    </td>
                    <td className="py-3 px-2">{formatDate(orden.createdAt)}</td>
                    <td className="py-3 px-2 font-medium">{formatCurrency(orden.total)}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">{orden.estado}</Badge>
                    </td>
                  </tr>
                ))}
                {ordenes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No hay órdenes recientes
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