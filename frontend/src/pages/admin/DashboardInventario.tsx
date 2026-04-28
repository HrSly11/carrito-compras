import { useQuery } from '@tanstack/react-query';
import {
  Package,
  AlertTriangle,
  PackageX,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import inventarioService from '@/services/inventario.service';
import { formatCurrency } from '@/lib/utils';

function KPICard({ title, value, subtitle, icon: Icon, variant = 'default' }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-yellow-500/10 text-yellow-600',
    danger: 'bg-red-500/10 text-red-600',
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

export default function DashboardInventario() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardInventarioStats'],
    queryFn: () => inventarioService.getInventarioStats(),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['inventarioBajoStock'],
    queryFn: () => inventarioService.getAll({ filter: 'low', page: 1, limit: 10 }),
  });

  const { data: outOfStock } = useQuery({
    queryKey: ['inventarioAgotado'],
    queryFn: () => inventarioService.getAll({ filter: 'out', page: 1, limit: 10 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Inventario</h1>
        <p className="text-muted-foreground">Control y estado del inventario</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Productos"
          value={stats?.totalProductos || 0}
          icon={Package}
          variant="default"
        />
        <KPICard
          title="Agotados"
          value={stats?.productosAgotados || 0}
          icon={PackageX}
          variant="danger"
        />
        <KPICard
          title="Stock Bajo"
          value={stats?.productosStockBajo || 0}
          icon={AlertTriangle}
          variant="warning"
        />
        <KPICard
          title="Valor Inventario"
          value={formatCurrency(stats?.valorTotalInventario || 0)}
          icon={TrendingDown}
          variant="default"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos Agotados</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/inventario?filter=out">Ver todos</a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outOfStock?.inventario?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    <PackageX className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-sm">{item.producto?.nombre}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.producto?.sku}</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Agotado</Badge>
                </div>
              ))}
              {(!outOfStock?.inventario || outOfStock.inventario.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">No hay productos agotados</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stock Bajo</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/inventario?filter=low">Ver todos</a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStock?.inventario?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm">{item.producto?.nombre}</p>
                      <p className="text-xs text-muted-foreground">Stock: {item.stock_actual} / Min: {item.stock_minimo}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Stock bajo</Badge>
                </div>
              ))}
              {(!lowStock?.inventario || lowStock.inventario.length === 0) && (
                <p className="text-center py-4 text-muted-foreground">No hay productos con stock bajo</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Producto</th>
                  <th className="text-left py-3 px-2 font-medium">SKU</th>
                  <th className="text-left py-3 px-2 font-medium">Stock Actual</th>
                  <th className="text-left py-3 px-2 font-medium">Stock Mínimo</th>
                  <th className="text-left py-3 px-2 font-medium">Precio</th>
                  <th className="text-left py-3 px-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats?.stockActual?.slice(0, 10).map((item: any) => {
                  const isOut = item.stock === 0;
                  const isLow = item.stock > 0 && item.stock <= (item.stock_minimo || 10);
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{item.nombre}</td>
                      <td className="py-3 px-2 text-muted-foreground">{item.sku}</td>
                      <td className="py-3 px-2">{item.stock}</td>
                      <td className="py-3 px-2">{item.stock_minimo || 10}</td>
                      <td className="py-3 px-2">{formatCurrency(item.precio)}</td>
                      <td className="py-3 px-2">
                        {isOut ? (
                          <Badge variant="destructive">Agotado</Badge>
                        ) : isLow ? (
                          <Badge variant="secondary">Stock bajo</Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!stats?.stockActual || stats.stockActual.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
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