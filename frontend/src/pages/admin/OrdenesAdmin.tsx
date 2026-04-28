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
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  Search,
  Eye,
  Printer,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import ordenService, { Orden, GetAllOrdenesParams, EstadoOrden } from '@/services/orden.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const estadoIcons: Record<string, React.ElementType> = {
  pendiente: Clock,
  procesando: Package,
  enviado: Truck,
  entregado: CheckCircle,
  cancelado: XCircle,
};

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  procesando: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  enviado: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  entregado: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelado: 'bg-red-500/10 text-red-600 border-red-500/20',
};

function OrderDetailModal({
  orden,
  estados,
  open,
  onClose,
  onEstadoChange,
}: {
  orden: Orden | null;
  estados: EstadoOrden[];
  open: boolean;
  onClose: () => void;
  onEstadoChange: (ordenId: number, nuevoEstado: string) => void;
}) {
  const [selectedEstado, setSelectedEstado] = useState('');

  if (!orden) return null;

  const estadoActual = orden.estado?.toLowerCase() || 'pendiente';
  const EstadoIcon = estadoIcons[estadoActual] || Clock;

  const handleEstadoChange = () => {
    if (selectedEstado && orden.id) {
      onEstadoChange(orden.id, selectedEstado);
      setSelectedEstado('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Orden #{orden.numero}
            <Badge className={estadoColors[estadoActual]}>
              <EstadoIcon className="h-3 w-3 mr-1" />
              {orden.estado}
            </Badge>
          </DialogTitle>
          <DialogDescription>Creada el {formatDate(orden.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Cliente</h3>
              <div>
                <p className="font-medium">{orden.usuario?.nombre}</p>
                <p className="text-sm text-muted-foreground">{orden.usuario?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Envío</h3>
              {orden.direccion_envio ? (
                <div>
                  <p className="text-sm">{orden.direccion_envio.direccion}</p>
                  <p className="text-sm text-muted-foreground">
                    {orden.direccion_envio.ciudad}, {orden.direccion_envio.departamento}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {orden.direccion_envio.codigo_postal}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No disponible</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Métodos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>{orden.metodo_envio?.nombre || 'No disponible'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Pago:</span>
                <span>{orden.metodo_pago?.nombre || 'No disponible'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Items</h3>
            <div className="border rounded-lg divide-y">
              {orden.items.map((item) => (
                <div key={item.id} className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {item.producto.imagenes?.[0] ? (
                      <img
                        src={item.producto.imagenes[0].url}
                        alt={item.producto.nombre}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.precio_unitario)} x {item.cantidad}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.precio_unitario * item.cantidad)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(orden.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IGV</span>
              <span>{formatCurrency(orden.igv)}</span>
            </div>
            {orden.descuento > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento</span>
                <span>-{formatCurrency(orden.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Costo envío</span>
              <span>{formatCurrency(orden.costo_envio)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(orden.total)}</span>
            </div>
          </div>

          {orden.notas && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Notas</h3>
              <p className="text-sm bg-muted p-3 rounded-lg">{orden.notas}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">
              Cambiar Estado
            </h3>
            <div className="flex gap-2">
              <Select
                value={selectedEstado}
                onValueChange={setSelectedEstado}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {(estados as any[])?.map((estado: any, idx: number) => (
                    <SelectItem key={`${estado.estado}-${idx}`} value={estado.estado}>
                      {estado.descripcion || estado.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleEstadoChange} disabled={!selectedEstado}>
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Factura
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrdenesAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ desde?: string; hasta?: string }>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedOrder, setSelectedOrder] = useState<Orden | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const params: GetAllOrdenesParams = {
    page,
    limit,
    estado: statusFilter || undefined,
    fechaDesde: dateRange.desde,
    fechaHasta: dateRange.hasta,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ordenes', page, limit, statusFilter, dateRange],
    queryFn: () => ordenService.getAllOrdenes(params),
  });

  const { data: estados } = useQuery({
    queryKey: ['estadosOrden'],
    queryFn: () => ordenService.getEstadosOrden(),
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      ordenService.updateEstadoOrden(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['ordenesRecientes'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el estado');
    },
  });

  const columns: ColumnDef<Orden>[] = useMemo(
    () => [
      {
        accessorKey: 'numero',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Número
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue('numero')}</span>
        ),
      },
      {
        accessorKey: 'usuario',
        header: 'Cliente',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.usuario?.nombre}</p>
            <p className="text-xs text-muted-foreground">{row.original.usuario?.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Fecha
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.getValue('createdAt'))}</span>
        ),
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Total
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{formatCurrency(row.getValue('total'))}</span>
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
          const estado = row.getValue('estado') as string;
          const estadoLower = estado?.toLowerCase() || 'pendiente';
          return (
            <Badge className={estadoColors[estadoLower]}>
              {row.getValue('estado')}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedOrder(row.original);
                setDetailModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: data?.meta?.totalPages || 1,
  });

  const handleViewOrder = async (orderId: number) => {
    try {
      const orden = await ordenService.getOrdenById(orderId);
      setSelectedOrder(orden);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error('Error al cargar la orden');
    }
  };

  const handleEstadoChange = (ordenId: number, nuevoEstado: string) => {
    updateEstadoMutation.mutate({ id: ordenId, estado: nuevoEstado });
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Error al cargar las órdenes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes</h1>
          <p className="text-muted-foreground">Gestiona las órdenes de tus clientes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Lista de Órdenes</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar orden..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">Todos</SelectItem>
                  {(estados as any[])?.map((estado: any, idx: number) => (
                    <SelectItem key={`${estado.estado}-${idx}`} value={estado.estado}>
                      {estado.descripcion || estado.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="w-[150px]"
                value={dateRange.desde || ''}
                onChange={(e) => setDateRange({ ...dateRange, desde: e.target.value })}
              />
              <Input
                type="date"
                className="w-[150px]"
                value={dateRange.hasta || ''}
                onChange={(e) => setDateRange({ ...dateRange, hasta: e.target.value })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
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
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleViewOrder(row.original.id)}
                      >
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Página</span>
                  <span className="font-medium">{page}</span>
                  <span>de</span>
                  <span className="font-medium">{data?.meta?.totalPages || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(limit)}
                    onValueChange={(v) => {
                      setLimit(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data?.meta?.totalPages || 1, p + 1))}
                    disabled={page >= (data?.meta?.totalPages || 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <OrderDetailModal
        orden={selectedOrder}
        estados={estados || []}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        onEstadoChange={handleEstadoChange}
      />
    </div>
  );
}
