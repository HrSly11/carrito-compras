import { useQuery } from '@tanstack/react-query';
import { Clock, ShoppingCart, Package, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ordenService from '@/services/orden.service';
import productoService from '@/services/producto.service';
import clienteService from '@/services/cliente.service';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

function KPICard({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-600">{title}</p>
            <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-4 rounded-full bg-blue-100">
            <Icon className="h-7 w-7 text-blue-600" />
          </div>
        </div>
        {trend && (
          <div className={`mt-3 text-xs font-medium ${trendColors[trend]}`}>
            {trend === 'up' && '↑ Mejora vs ayer'}
            {trend === 'down' && '↓ Bajó vs ayer'}
            {trend === 'neutral' && '→ Sin cambios'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardVendedor() {
  const { data: ordenesData } = useQuery({
    queryKey: ['ordenesVendedor'],
    queryFn: () => ordenService.getAllOrdenes({ limit: 50 }),
  });

  const { data: productosData } = useQuery({
    queryKey: ['productosVendedor'],
    queryFn: () => productoService.getProductos({ limit: 5, destacado: true }),
  });

  const { data: clientesData } = useQuery({
    queryKey: ['clientesVendedor'],
    queryFn: () => clienteService.getClientes({ limit: 10 }),
  });

  const ordenes = ordenesData?.data || [];
  const productos = productosData?.data || [];
  const clientes = clientesData?.data || [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const ordenesHoy = ordenes.filter((o: any) => new Date(o.createdAt) >= hoy);
  const ventasHoy = ordenesHoy
    .filter((o: any) => o.estado === 'pagada' || o.estado === 'en_proceso' || o.estado === 'enviada' || o.estado === 'entregada')
    .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

  const ultimasOrdenes = ordenes.slice(0, 8);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Vendedor</h1>
          <p className="text-muted-foreground mt-1">Resumen de tu actividad de ventas</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Última actualización: {formatRelativeTime(new Date())}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Órdenes Hoy"
          value={ordenesHoy.length}
          subtitle="Pedidos realizados hoy"
          icon={ShoppingCart}
          trend={ordenesHoy.length > 0 ? 'up' : 'neutral'}
        />
        <KPICard
          title="Ventas del Día"
          value={formatCurrency(ventasHoy)}
          subtitle="Ingresos de hoy"
          icon={TrendingUp}
          trend={ventasHoy > 0 ? 'up' : 'neutral'}
        />
        <KPICard
          title="Órdenes Totales"
          value={ordenes.length}
          subtitle="Últimas 50 órdenes"
          icon={CheckCircle}
        />
        <KPICard
          title="Clientes Activos"
          value={clientes.length}
          subtitle="Registrados"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-slate-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Órdenes Recientes
            </CardTitle>
            <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
              <a href="/admin/ordenes">Ver todas</a>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {ultimasOrdenes.map((orden: any) => (
                <div key={orden.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      orden.estado === 'completada' ? 'bg-green-100' :
                      orden.estado === 'pendiente' ? 'bg-yellow-100' :
                      orden.estado === 'cancelada' ? 'bg-red-100' : 'bg-slate-100'
                    }`}>
                      <ShoppingCart className={`h-4 w-4 ${
                        orden.estado === 'completada' ? 'text-green-600' :
                        orden.estado === 'pendiente' ? 'text-yellow-600' :
                        orden.estado === 'cancelada' ? 'text-red-600' : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{orden.numero}</p>
                      <p className="text-xs text-muted-foreground">
                        {orden.usuario?.nombre || 'Cliente'} • {formatRelativeTime(new Date(orden.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(orden.total)}</p>
                    <Badge variant={
                      orden.estado === 'completada' ? 'default' :
                      orden.estado === 'pendiente' ? 'secondary' : 'destructive'
                    } className="text-xs mt-1">
                      {orden.estado}
                    </Badge>
                  </div>
                </div>
              ))}
              {ultimasOrdenes.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay órdenes recientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-4 border-b bg-slate-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Clientes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {clientes.slice(0, 6).map((cliente: any) => (
                <div key={cliente.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-sm">
                        {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cliente.nombre} {cliente.apellido}</p>
                      <p className="text-xs text-muted-foreground">{cliente.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {cliente.ordenesCount || 0} órdenes
                  </Badge>
                </div>
              ))}
              {clientes.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay clientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-4 border-b bg-slate-50 rounded-t-lg">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            Productos Destacados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {productos.map((producto: any) => (
              <div key={producto.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                <div className="aspect-square bg-slate-100 rounded-md mb-3 overflow-hidden">
                  {producto.imagenes?.[0]?.url ? (
                    <img src={producto.imagenes[0].url} alt={producto.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                </div>
                <p className="font-medium text-sm truncate">{producto.nombre}</p>
                <p className="text-xs text-muted-foreground">{producto.categoria?.nombre}</p>
                <p className="font-bold text-sm mt-1">{formatCurrency(producto.precio)}</p>
              </div>
            ))}
            {productos.length === 0 && (
              <div className="col-span-5 p-8 text-center text-muted-foreground">
                No hay productos destacados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}