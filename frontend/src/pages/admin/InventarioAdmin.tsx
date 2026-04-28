import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import {
  PackageSearch,
  AlertTriangle,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDownUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import inventarioService, {
  InventarioProducto,
  MovimientoInventario,
  GetInventarioParams,
  GetMovimientosParams,
  AjusteInventario,
} from '@/services/inventario.service';
import toast from 'react-hot-toast';

const estadoStyles: Record<string, { bg: string; text: string }> = {
  disponible: { bg: 'bg-green-500/10', text: 'text-green-600' },
  bajo_stock: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  agotado: { bg: 'bg-red-500/10', text: 'text-red-600' },
  reservado: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
};

const movimientoIcons: Record<string, React.ElementType> = {
  entrada: Plus,
  salida: Minus,
  ajuste: ArrowDownUp,
  reserva: PackageSearch,
  desreserva: ArrowDownUp,
};

const movimientoColors: Record<string, string> = {
  entrada: 'text-green-600',
  salida: 'text-red-600',
  ajuste: 'text-blue-600',
  reserva: 'text-yellow-600',
  desreserva: 'text-purple-600',
};

function AjusteModal({
  producto,
  open,
  onClose,
  onAjuste,
}: {
  producto: InventarioProducto | null;
  open: boolean;
  onClose: () => void;
  onAjuste: (data: AjusteInventario) => void;
}) {
  const [cantidad, setCantidad] = useState('');
  const [tipo, setTipo] = useState<'suma' | 'resta'>('suma');
  const [motivo, setMotivo] = useState('');

  if (!producto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidad || !motivo) {
      toast.error('Completa todos los campos');
      return;
    }
    onAjuste({
      productoId: producto.productoId,
      cantidad: parseInt(cantidad),
      tipo,
      motivo,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuste de Inventario</DialogTitle>
          <DialogDescription>
            Ajustar stock para {producto.nombreProducto}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Stock Actual</p>
              <p className="text-lg font-bold">{producto.stockActual}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Stock Disponible</p>
              <p className="text-lg font-bold">{producto.stockDisponible}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Ajuste</label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as 'suma' | 'resta')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suma">Sumar (Entrada)</SelectItem>
                <SelectItem value="resta">Restar (Salida)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad</label>
            <Input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo</label>
            <Input
              placeholder="Ej: Devolución, Merma, Corrección..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Aplicar Ajuste</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LowStockAlert() {
  const { data: productosBajoStock, isLoading } = useQuery({
    queryKey: ['productosBajoStock'],
    queryFn: () => inventarioService.getProductosBajoStock(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!productosBajoStock?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay productos con stock bajo
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {productosBajoStock.slice(0, 5).map((producto) => (
        <div
          key={producto.id}
          className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="font-medium text-sm">{producto.nombreProducto}</p>
              <p className="text-xs text-muted-foreground">SKU: {producto.sku}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-yellow-600">{producto.stockDisponible}</p>
            <p className="text-xs text-muted-foreground">disponible</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InventarioAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [stockFilter, setStockFilter] = useState<string>('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<InventarioProducto | null>(null);

  const [movimientoPage, setMovimientoPage] = useState(1);
  const [movimientoLimit] = useState(10);
  const [movimientoTipo, setMovimientoTipo] = useState<string>('');
  const [movimientoProducto] = useState<string>('');
  const [movimientoFechaDesde, setMovimientoFechaDesde] = useState('');
  const [movimientoFechaHasta, setMovimientoFechaHasta] = useState('');

  const inventarioParams: GetInventarioParams = {
    page,
    limit,
    estado: stockFilter || undefined,
  };

  const movimientosParams: GetMovimientosParams = {
    page: movimientoPage,
    limit: movimientoLimit,
    tipo: movimientoTipo || undefined,
    productoId: movimientoProducto ? parseInt(movimientoProducto) : undefined,
    fechaDesde: movimientoFechaDesde || undefined,
    fechaHasta: movimientoFechaHasta || undefined,
  };

  const { data: inventario, isLoading: inventarioLoading } = useQuery({
    queryKey: ['inventario', page, limit, stockFilter],
    queryFn: async () => {
      try {
        return await inventarioService.getInventario(inventarioParams);
      } catch (error) {
        console.error('[InventarioAdmin] getInventario error:', error);
        return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
      }
    },
  });

  const { data: movimientos, isLoading: movimientosLoading } = useQuery({
    queryKey: ['movimientos', movimientoPage, movimientoLimit, movimientoTipo, movimientoProducto, movimientoFechaDesde, movimientoFechaHasta],
    queryFn: async () => {
      try {
        return await inventarioService.getMovimientos(movimientosParams);
      } catch (error) {
        console.error('[InventarioAdmin] getMovimientos error:', error);
        return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
      }
    },
  });

  const ajusteMutation = useMutation({
    mutationFn: (data: AjusteInventario) => inventarioService.ajustarInventario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['productosBajoStock'] });
      toast.success('Ajuste aplicado exitosamente');
      setAjusteModalOpen(false);
      setSelectedProducto(null);
    },
    onError: () => {
      toast.error('Error al aplicar el ajuste');
    },
  });

  const inventarioColumns: ColumnDef<InventarioProducto>[] = useMemo(
    () => [
      {
        accessorKey: 'nombreProducto',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Producto
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.getValue('nombreProducto')}</p>
            <p className="text-xs text-muted-foreground">SKU: {row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'stockActual',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Actual
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('stockActual')}</span>
        ),
      },
      {
        accessorKey: 'stockReservado',
        header: 'Reservado',
        cell: ({ row }) => (
          <span className="text-blue-600">{row.getValue('stockReservado')}</span>
        ),
      },
      {
        accessorKey: 'stockDisponible',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Disponible
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => {
          const disponible = row.getValue('stockDisponible') as number;
          return (
            <span className={disponible === 0 ? 'text-red-600 font-bold' : disponible < 10 ? 'text-yellow-600 font-medium' : ''}>
              {disponible}
            </span>
          );
        },
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
          const estado = row.getValue('estado') as string;
          const styles = estadoStyles[estado] || estadoStyles.disponible;
          return (
            <Badge className={`${styles.bg} ${styles.text} border-0`}>
              {estado?.replace('_', ' ')}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedProducto(row.original);
              setAjusteModalOpen(true);
            }}
          >
            Ajustar
          </Button>
        ),
      },
    ],
    []
  );

  const movimientosColumns: ColumnDef<MovimientoInventario>[] = useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-sm">{new Date(row.getValue('createdAt')).toLocaleString('es-MX')}</span>
        ),
      },
      {
        accessorKey: 'productoNombre',
        header: 'Producto',
        cell: ({ row }) => (
          <p className="font-medium text-sm">{row.getValue('productoNombre')}</p>
        ),
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => {
          const tipo = row.getValue('tipo') as string;
          const Icon = movimientoIcons[tipo] || ArrowDownUp;
          return (
            <Badge className={movimientoColors[tipo]} variant="outline">
              <Icon className="h-3 w-3 mr-1" />
              {tipo}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'cantidad',
        header: 'Cantidad',
        cell: ({ row }) => {
          const tipo = row.original.tipo;
          const cantidad = row.getValue('cantidad') as number;
          return (
            <span className={tipo === 'entrada' || tipo === 'desreserva' ? 'text-green-600' : 'text-red-600'}>
              {tipo === 'entrada' || tipo === 'desreserva' ? '+' : '-'}{cantidad}
            </span>
          );
        },
      },
      {
        accessorKey: 'stockAnterior',
        header: 'Stock Anterior',
        cell: ({ row }) => <span>{row.getValue('stockAnterior')}</span>,
      },
      {
        accessorKey: 'stockNuevo',
        header: 'Stock Nuevo',
        cell: ({ row }) => <span>{row.getValue('stockNuevo')}</span>,
      },
      {
        accessorKey: 'motivo',
        header: 'Motivo',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.getValue('motivo')}</span>
        ),
      },
      {
        accessorKey: 'usuarioNombre',
        header: 'Usuario',
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue('usuarioNombre')}</span>
        ),
      },
    ],
    []
  );

  const inventarioTable = useReactTable({
    data: inventario?.data || [],
    columns: inventarioColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: inventario?.meta?.totalPages || 1,
  });

  const movimientosTable = useReactTable({
    data: movimientos?.data || [],
    columns: movimientosColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: movimientos?.meta?.totalPages || 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">Gestiona el stock de tus productos</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stock Overview</CardTitle>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="bajo_stock">Bajo Stock</SelectItem>
                  <SelectItem value="agotado">Agotado</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {inventarioLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      {inventarioTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b bg-muted/50">
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="text-left py-3 px-4 font-medium">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {inventarioTable.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-muted/50">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="py-3 px-4">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between py-4">
                  <p className="text-sm text-muted-foreground">
                    Total: {inventario?.meta?.total || 0} productos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Página {page} de {inventario?.meta?.totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(inventario?.meta?.totalPages || 1, p + 1))}
                      disabled={page >= (inventario?.meta?.totalPages || 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LowStockAlert />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos de Inventario</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={movimientoTipo} onValueChange={setMovimientoTipo}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
                <SelectItem value="reserva">Reserva</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-[140px]"
              value={movimientoFechaDesde}
              onChange={(e) => setMovimientoFechaDesde(e.target.value)}
              placeholder="Desde"
            />
            <Input
              type="date"
              className="w-[140px]"
              value={movimientoFechaHasta}
              onChange={(e) => setMovimientoFechaHasta(e.target.value)}
              placeholder="Hasta"
            />
          </div>
        </CardHeader>
        <CardContent>
          {movimientosLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    {movimientosTable.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="text-left py-3 px-4 font-medium">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {movimientosTable.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-muted/50">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-3 px-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between py-4">
                <p className="text-sm text-muted-foreground">
                  Total: {movimientos?.meta?.total || 0} movimientos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovimientoPage((p) => Math.max(1, p - 1))}
                    disabled={movimientoPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {movimientoPage} de {movimientos?.meta?.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovimientoPage((p) => Math.min(movimientos?.meta?.totalPages || 1, p + 1))}
                    disabled={movimientoPage >= (movimientos?.meta?.totalPages || 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AjusteModal
        producto={selectedProducto}
        open={ajusteModalOpen}
        onClose={() => {
          setAjusteModalOpen(false);
          setSelectedProducto(null);
        }}
        onAjuste={(data) => ajusteMutation.mutate(data)}
      />
    </div>
  );
}
