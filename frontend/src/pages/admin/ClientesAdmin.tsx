import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
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
import clienteService, { Cliente, DetalleCliente, GetClientesParams } from '@/services/cliente.service';
import { formatCurrency, formatDate } from '@/lib/utils';

const segmentoStyles: Record<string, { bg: string; text: string; label: string }> = {
  nuevo: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Nuevo' },
  recurrente: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Recurrente' },
  inactivo: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'Inactivo' },
  vip: { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'VIP' },
};

function CustomerDetailModal({
  cliente,
  open,
  onClose,
}: {
  cliente: DetalleCliente | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!cliente) return null;

  const segmentoStyle = segmentoStyles[cliente.segmento] || segmentoStyles.nuevo;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {cliente.nombre} {cliente.apellido}
            <Badge className={`${segmentoStyle.bg} ${segmentoStyle.text} border-0`}>
              {segmentoStyle.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{cliente.email}</span>
            </div>
            {cliente.telefono && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.telefono}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Gastado</p>
              <p className="text-xl font-bold">{formatCurrency(cliente.totalGastado)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Órdenes</p>
              <p className="text-xl font-bold">{cliente.ordenesCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Promedio</p>
              <p className="text-xl font-bold">
                {cliente.ordenesCount > 0
                  ? formatCurrency(cliente.totalGastado / cliente.ordenesCount)
                  : formatCurrency(0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Última Compra</p>
              <p className="text-xl font-bold">
                {cliente.ultimaCompra ? formatDate(cliente.ultimaCompra) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Direcciones</h3>
            {cliente.direcciones.length > 0 ? (
              <div className="space-y-2">
                {cliente.direcciones.map((dir) => (
                  <div key={dir.id} className="p-3 rounded-lg border">
                    <p className="font-medium text-sm">{dir.nombre}</p>
                    <div className="flex items-start gap-2 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-0.5" />
                      <span>
                        {dir.direccion}, {dir.ciudad}, {dir.departamento}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{dir.telefono}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay direcciones registradas</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Historial de Órdenes ({cliente.ordenes.length})
            </h3>
            {cliente.ordenes.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {cliente.ordenes.map((orden) => (
                  <div key={orden.id} className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">#{orden.numero}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(orden.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(orden.total)}</p>
                      <Badge variant="outline" className="text-xs">
                        {orden.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay órdenes</p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientesAdmin() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [segmentoFilter, setSegmentoFilter] = useState<string>('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedCliente, setSelectedCliente] = useState<DetalleCliente | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const params: GetClientesParams = {
    page,
    limit,
    busqueda: search || undefined,
    segmento: segmentoFilter || undefined,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clientes', page, limit, search, segmentoFilter],
    queryFn: () => clienteService.getClientes(params),
  });

  const columns: ColumnDef<Cliente>[] = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Nombre
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {row.getValue('nombre')} {row.original.apellido}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{row.getValue('email')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'totalGastado',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Total Gastado
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{formatCurrency(row.getValue('totalGastado'))}</span>
        ),
      },
      {
        accessorKey: 'ordenesCount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Órdenes
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('ordenesCount')}</span>
        ),
      },
      {
        accessorKey: 'ultimaCompra',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Última Compra
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => {
          const ultimaCompra = row.getValue('ultimaCompra') as string | undefined;
          return (
            <span className="text-sm">
              {ultimaCompra ? formatDate(ultimaCompra) : 'Nunca'}
            </span>
          );
        },
      },
      {
        accessorKey: 'segmento',
        header: 'Segmento',
        cell: ({ row }) => {
          const segmento = row.getValue('segmento') as string;
          const style = segmentoStyles[segmento] || segmentoStyles.nuevo;
          return (
            <Badge className={`${style.bg} ${style.text} border-0`}>
              {style.label}
            </Badge>
          );
        },
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
    manualPagination: true,
    pageCount: data?.meta?.totalPages || 1,
  });

  const handleViewCliente = async (clienteId: number) => {
    try {
      const detalle = await clienteService.getClienteById(clienteId);
      setSelectedCliente(detalle);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching client details:', error);
    }
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Error al cargar los clientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tus clientes y segmentos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Select value={segmentoFilter} onValueChange={setSegmentoFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="recurrente">Recurrente</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
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
                        onClick={() => handleViewCliente(row.original.id)}
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

      <CustomerDetailModal
        cliente={selectedCliente}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCliente(null);
        }}
      />
    </div>
  );
}
