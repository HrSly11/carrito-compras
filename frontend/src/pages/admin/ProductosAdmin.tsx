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
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import productoService, { IProducto } from '@/services/producto.service';
import api from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProductoFormData {
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  stock: number;
  sku: string;
  categoriaId: number;
  activo: boolean;
  destacado: boolean;
  imagenUrl?: string;
}

const emptyFormData: ProductoFormData = {
  nombre: '',
  slug: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  sku: '',
  categoriaId: 0,
  activo: true,
  destacado: false,
  imagenUrl: '',
};

export default function ProductosAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProducto | null>(null);
  const [formData, setFormData] = useState<ProductoFormData>(emptyFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos', page, limit, search],
    queryFn: () => productoService.getProductos({ page, limit, busqueda: search }),
  });

  const createMutation = useMutation({
    mutationFn: (newProduct: Partial<ProductoFormData>) =>
      productoService.createProducto?.(newProduct as any) || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto creado exitosamente');
      closeModal();
    },
    onError: () => {
      toast.error('Error al crear el producto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductoFormData> }) =>
      productoService.updateProducto?.(id, data as any) || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto actualizado exitosamente');
      closeModal();
    },
    onError: () => {
      toast.error('Error al actualizar el producto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productoService.deleteProducto?.(id) || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto eliminado exitosamente');
      closeDeleteModal();
    },
    onError: () => {
      toast.error('Error al eliminar el producto');
    },
  });

  const columns: ColumnDef<IProducto>[] = useMemo(
    () => [
      {
        id: 'imagen',
        header: '',
        cell: ({ row }) => {
          const imgUrl = row.original.imagenes?.[0]?.url;
          return imgUrl ? (
            <img src={imgUrl} alt={row.original.nombre} className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        },
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue('sku')}</span>
        ),
      },
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
            <p className="font-medium">{row.getValue('nombre')}</p>
            <p className="text-xs text-muted-foreground">{row.original.descripcion?.slice(0, 50)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'precio',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Precio
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{formatCurrency(row.getValue('precio'))}</span>
        ),
      },
      {
        accessorKey: 'stock',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Stock
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-4 w-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => {
          const stock = row.getValue('stock') as number;
          return (
            <div className="flex items-center gap-2">
              <span className={stock === 0 ? 'text-red-600 font-medium' : stock < 10 ? 'text-yellow-600' : ''}>
                {stock}
              </span>
              {stock === 0 && <Badge variant="destructive">Agotado</Badge>}
              {stock > 0 && stock < 10 && <Badge variant="secondary">Bajo</Badge>}
            </div>
          );
        },
      },
      {
        accessorKey: 'categoria',
        header: 'Categoría',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.categoria?.nombre}</Badge>
        ),
      },
      {
        accessorKey: 'activo',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant={row.getValue('activo') ? 'default' : 'secondary'}>
            {row.getValue('activo') ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Package className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedProduct(row.original);
                  const existingImg = row.original.imagenes?.[0]?.url || '';
                  setFormData({
                    nombre: row.original.nombre,
                    slug: row.original.slug,
                    descripcion: row.original.descripcion || '',
                    precio: row.original.precio_venta,
                    stock: row.original.stock,
                    sku: row.original.sku,
                    categoriaId: row.original.categoria?.id || 0,
                    activo: row.original.activo,
                    destacado: row.original.destacado,
                    imagenUrl: existingImg,
                  });
                  setImageFile(null);
                  setImagePreview('');
                  setModalOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedProduct(row.original);
                  setDeleteModalOpen(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: data?.meta?.totalPages || 1,
  });

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    setFormData(emptyFormData);
    setImageFile(null);
    setImagePreview('');
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalData = { ...formData };

    // Upload image first if one was selected
    if (imageFile) {
      try {
        const fd = new FormData();
        fd.append('imagen', imageFile);
        const uploadRes = await api.post('/uploads/productos', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploadedUrl = uploadRes.data?.data?.url;
        if (uploadedUrl) {
          finalData.imagenUrl = `http://localhost:3001${uploadedUrl}`;
        }
      } catch {
        toast.error('Error al subir la imagen');
        return;
      }
    }

    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Error al cargar los productos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Gestiona tu catálogo de productos</p>
        </div>
        <Button
          onClick={() => {
            setFormData(emptyFormData);
            setSelectedProduct(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Productos</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[300px]"
                />
              </div>
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
                      <SelectItem value="100">100</SelectItem>
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

      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? 'Actualiza la información del producto'
                : 'Completa la información para crear un nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="text-sm font-medium">
                    Nombre
                  </label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="sku" className="text-sm font-medium">
                    SKU
                  </label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="descripcion" className="text-sm font-medium">
                  Descripción
                </label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="precio" className="text-sm font-medium">
                    Precio
                  </label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="stock" className="text-sm font-medium">
                    Stock
                  </label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-sm font-medium">Producto activo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.destacado}
                    onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-sm font-medium">Producto destacado</span>
                </label>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Imagen del producto</label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="imagen-upload"
                      className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-muted-foreground mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-muted-foreground">
                          {imageFile ? imageFile.name : 'Haz clic para seleccionar imagen'}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">JPG, PNG, WEBP • máx. 5MB</p>
                      </div>
                      <input
                        id="imagen-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  {(imagePreview || formData.imagenUrl || selectedProduct?.imagenes?.[0]?.url) && (
                    <div className="relative h-28 w-28 rounded-lg overflow-hidden border bg-muted/50 flex-shrink-0">
                      <img
                        src={imagePreview || formData.imagenUrl || selectedProduct?.imagenes?.[0]?.url}
                        alt="Vista previa"
                        className="h-full w-full object-cover"
                      />
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(''); }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-black/80"
                        >×</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : selectedProduct
                  ? 'Actualizar'
                  : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={closeDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "
              {selectedProduct?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
