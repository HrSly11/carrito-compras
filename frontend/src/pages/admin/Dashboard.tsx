import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  Settings,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ordenService from '@/services/orden.service';
import productoService from '@/services/producto.service';
import clienteService from '@/services/cliente.service';
import inventarioService from '@/services/inventario.service';
import { formatCurrency, formatDate } from '@/lib/utils';

type DateRange = '7d' | '30d' | '90d';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const { data: ordenesData } = useQuery({
    queryKey: ['dashboardOrdenes'],
    queryFn: () => ordenService.getAllOrdenes({ limit: 100 }),
  });

  const { data: productosData } = useQuery({
    queryKey: ['dashboardProductos'],
    queryFn: () => productoService.getProductos({ limit: 100 }),
  });

  const { data: clientesData } = useQuery({
    queryKey: ['dashboardClientes'],
    queryFn: () => clienteService.getClientes({ limit: 100 }),
  });

  const { data: inventarioStats } = useQuery({
    queryKey: ['dashboardInventario'],
    queryFn: () => inventarioService.getInventarioStats(),
  });

  const ordenes = ordenesData?.data || [];
  const productos = productosData?.data || [];
  const clientes = clientesData?.data || [];
  const statsInv = inventarioStats || {};

  const now = new Date();
  let fechaDesde = new Date();
  switch (dateRange) {
    case '7d': fechaDesde.setDate(now.getDate() - 7); break;
    case '30d': fechaDesde.setDate(now.getDate() - 30); break;
    case '90d': fechaDesde.setDate(now.getDate() - 90); break;
  }

  const ordenesEnRango = ordenes.filter((o: any) => new Date(o.createdAt) >= fechaDesde);
  const ordenesCompletadas = ordenesEnRango.filter((o: any) => o.estado === 'completada');
  const ordenesPendientes = ordenesEnRango.filter((o: any) => o.estado === 'pendiente');
  const ventasTotales = ordenesCompletadas.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const ticketPromedio = ordenesCompletadas.length > 0 ? ventasTotales / ordenesCompletadas.length : 0;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-100 to-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Resumen completo del sistema</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[180px] bg-white shadow-sm">
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
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Ventas Totales</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(ventasTotales)}</p>
                <p className="text-emerald-200 text-xs mt-1">{dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} días</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-400/30">
                <DollarSign className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Órdenes Totales</p>
                <p className="text-3xl font-bold mt-1">{ordenes.length}</p>
                <p className="text-blue-200 text-xs mt-1">pedidos registrados</p>
              </div>
              <div className="p-3 rounded-full bg-blue-400/30">
                <ShoppingCart className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Productos</p>
                <p className="text-3xl font-bold mt-1">{productos.length}</p>
                <p className="text-purple-200 text-xs mt-1">en catálogo</p>
              </div>
              <div className="p-3 rounded-full bg-purple-400/30">
                <Package className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Clientes</p>
                <p className="text-3xl font-bold mt-1">{clientes.length}</p>
                <p className="text-amber-200 text-xs mt-1">registrados</p>
              </div>
              <div className="p-3 rounded-full bg-amber-400/30">
                <Users className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Button variant="outline" className="h-auto py-4 px-4 justify-start bg-white shadow-sm hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200" asChild>
          <a href="/admin/ordenes/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva orden
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 px-4 justify-start bg-white shadow-sm hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200" asChild>
          <a href="/admin/inventario?filter=low">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Stock bajo
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 px-4 justify-start bg-white shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200" asChild>
          <a href="/admin/inventario?filter=out">
            <Package className="h-4 w-4 mr-2" />
            Ver agotados
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 px-4 justify-start bg-white shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" asChild>
          <a href="/admin/productos">
            <BarChart3 className="h-4 w-4 mr-2" />
            Productos
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 px-4 justify-start bg-white shadow-sm hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200" asChild>
          <a href="/admin/clientes">
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 px-4 justify-start bg-white shadow-sm hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200" asChild>
          <a href="/admin/report">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Órdenes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[350px] overflow-y-auto">
              {ordenes.slice(0, 8).map((orden: any) => (
                <div key={orden.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      orden.estado === 'completada' ? 'bg-green-100' :
                      orden.estado === 'pendiente' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <ShoppingCart className={`h-4 w-4 ${
                        orden.estado === 'completada' ? 'text-green-600' :
                        orden.estado === 'pendiente' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{orden.numero}</p>
                      <p className="text-xs text-muted-foreground">{orden.usuario?.nombre} • {formatDate(orden.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(orden.total)}</p>
                    <Badge variant={orden.estado === 'completada' ? 'default' : orden.estado === 'pendiente' ? 'secondary' : 'destructive'} className="text-xs">
                      {orden.estado}
                    </Badge>
                  </div>
                </div>
              ))}
              {ordenes.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No hay órdenes</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Estado del Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-xl text-center border-2 border-green-100">
                  <p className="text-2xl font-bold text-green-700">
                    {(statsInv.totalProductos || 0) - (statsInv.productosAgotados || 0) - (statsInv.productosStockBajo || 0)}
                  </p>
                  <p className="text-xs text-green-600 font-medium">OK</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center border-2 border-amber-100">
                  <p className="text-2xl font-bold text-amber-700">{statsInv.productosStockBajo || 0}</p>
                  <p className="text-xs text-amber-600 font-medium">Bajo Stock</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl text-center border-2 border-red-100">
                  <p className="text-2xl font-bold text-red-700">{statsInv.productosAgotados || 0}</p>
                  <p className="text-xs text-red-600 font-medium">Agotados</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium">Valor total inventario</span>
                  </div>
                  <span className="text-xl font-bold">{formatCurrency(statsInv.valorTotalInventario || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Productos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {productos.slice(0, 6).map((producto: any) => (
                <div key={producto.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                      {producto.imagenes?.[0]?.url ? (
                        <img src={producto.imagenes[0].url} alt={producto.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">{producto.categoria?.nombre || 'Sin categoría'}</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(producto.precio)}</p>
                </div>
              ))}
              {productos.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No hay productos</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600" />
              Últimos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {clientes.slice(0, 6).map((cliente: any) => (
                <div key={cliente.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0)}
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
                <div className="p-8 text-center text-muted-foreground">No hay clientes</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Resumen de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-emerald-600">{ordenesCompletadas.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Órdenes completadas</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-amber-600">{ordenesPendientes.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(ticketPromedio)}</p>
              <p className="text-xs text-muted-foreground mt-1">Ticket promedio</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-purple-600">{statsInv.totalProductos || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">SKUs activos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}