import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, PackageX, DollarSign, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import inventarioService from '@/services/inventario.service';
import { formatCurrency } from '@/lib/utils';

function InventoryKPICard({ title, value, subtitle, icon: Icon, variant }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const styles = {
    success: 'from-green-50 to-white border-green-200',
    warning: 'from-amber-50 to-white border-amber-200',
    danger: 'from-red-50 to-white border-red-200',
    neutral: 'from-blue-50 to-white border-blue-200',
  };

  const iconColors = {
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
    neutral: 'bg-blue-100 text-blue-600',
  };

  return (
    <Card className={`bg-gradient-to-br ${styles[variant]} border-2 shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-4 rounded-full ${iconColors[variant]}`}>
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardGerenteInventario() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardInventarioStats'],
    queryFn: () => inventarioService.getInventarioStats(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statsData = stats || {};

  const stockSaludable = statsData.totalProductos && statsData.totalProductos > 0
    ? Math.round(((statsData.totalProductos - (statsData.productosAgotados || 0) - (statsData.productosStockBajo || 0)) / statsData.totalProductos) * 100)
    : 100;

  const productosCriticos = (statsData.productosCriticos || []).filter((p: any) => p.stock === 0);
  const productosBajoStock = (statsData.productosCriticos || []).filter((p: any) => p.stock > 0);

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Gerente de Inventario</h1>
        <p className="text-muted-foreground mt-1">Control integral y métricas del inventario</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InventoryKPICard
          title="Valor Total Inventario"
          value={formatCurrency(statsData.valorTotalInventario || 0)}
          subtitle="Costo del stock actual"
          icon={DollarSign}
          variant="success"
        />
        <InventoryKPICard
          title="Total SKUs"
          value={statsData.totalProductos || 0}
          subtitle="Productos activos"
          icon={Package}
          variant="neutral"
        />
        <InventoryKPICard
          title="Productos Agotados"
          value={statsData.productosAgotados || 0}
          subtitle="Sin stock disponible"
          icon={PackageX}
          variant="danger"
        />
        <InventoryKPICard
          title="Stock Bajo"
          value={statsData.productosStockBajo || 0}
          subtitle="Requieren reposición"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-emerald-800">
              <CheckCircle className="h-5 w-5" />
              Salud del Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Nivel de stock saludable</span>
                  <span className="font-bold text-lg">{stockSaludable}%</span>
                </div>
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                    style={{ width: `${stockSaludable}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 bg-green-50 rounded-xl text-center border-2 border-green-100 shadow-sm">
                  <p className="text-3xl font-bold text-green-700">
                    {(statsData.totalProductos || 0) - (statsData.productosAgotados || 0) - (statsData.productosStockBajo || 0)}
                  </p>
                  <p className="text-xs font-medium text-green-600 mt-1">OK</p>
                </div>
                <div className="p-5 bg-amber-50 rounded-xl text-center border-2 border-amber-100 shadow-sm">
                  <p className="text-3xl font-bold text-amber-700">{statsData.productosStockBajo || 0}</p>
                  <p className="text-xs font-medium text-amber-600 mt-1">Bajo Stock</p>
                </div>
                <div className="p-5 bg-red-50 rounded-xl text-center border-2 border-red-100 shadow-sm">
                  <p className="text-3xl font-bold text-red-700">{statsData.productosAgotados || 0}</p>
                  <p className="text-xs font-medium text-red-600 mt-1">Agotado</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">Valor total del inventario</p>
                      <p className="text-xs text-muted-foreground">Basado en precio de costo</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(statsData.valorTotalInventario || 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {productosCriticos.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-red-50 text-xs font-bold text-red-700 uppercase tracking-wide">
                    Críticos - Agotados
                  </div>
                  {productosCriticos.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-red-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <PackageX className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.nombre}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">Agotado</Badge>
                    </div>
                  ))}
                </>
              )}

              {productosBajoStock.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-amber-50 text-xs font-bold text-amber-700 uppercase tracking-wide">
                    Atención - Stock Bajo
                  </div>
                  {productosBajoStock.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-amber-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.nombre}</p>
                          <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">Bajo</Badge>
                    </div>
                  ))}
                </>
              )}

              {productosCriticos.length === 0 && productosBajoStock.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay alertas de stock
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Productos que Requieren Atención
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Producto</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">SKU</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Stock Actual</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Stock Mínimo</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Estado</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(statsData.stockActual || []).slice(0, 15).map((item: any) => {
                  const isAgotado = item.stock === 0;
                  const isBajo = item.stock > 0 && item.stock <= (item.stock_minimo || 10);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-medium">{item.nombre}</td>
                      <td className="py-4 px-6 font-mono text-sm text-muted-foreground">{item.sku}</td>
                      <td className={`py-4 px-6 font-bold ${isAgotado ? 'text-red-600' : isBajo ? 'text-amber-600' : 'text-green-600'}`}>
                        {item.stock}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{item.stock_minimo || 10}</td>
                      <td className="py-4 px-6">
                        {isAgotado && <Badge variant="destructive" className="text-xs">Agotado</Badge>}
                        {isBajo && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">Stock bajo</Badge>}
                        {!isAgotado && !isBajo && <Badge variant="default" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Normal</Badge>}
                      </td>
                      <td className="py-4 px-6">
                        <Button size="sm" variant="outline" className="text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                          Reponer
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {(!statsData.stockActual || statsData.stockActual.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No hay datos de inventario
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