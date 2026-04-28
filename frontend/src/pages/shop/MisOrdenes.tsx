import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, ChevronRight, ChevronLeft, Filter } from 'lucide-react'
import ordenService from '@/services/orden.service'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ORDER_STATUS_COLORS: Record<string, string> = {
  pendiente_pago: 'bg-yellow-100 text-yellow-800',
  pagada: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  enviada: 'bg-purple-100 text-purple-800',
  entregada: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

export default function MisOrdenes() {
  const navigate = useNavigate()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['mis-ordenes', page, statusFilter],
    queryFn: () => ordenService.getMisOrdenes({ page, limit: 10, estado: statusFilter || undefined }),
    enabled: isAuthenticated && _hasHydrated,
  })

  if (!_hasHydrated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Cargando...</h1>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 mx-auto">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Inicia Sesión para Ver tus Órdenes</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Para ver tu historial de pedidos, necesitas iniciar sesión o crear una cuenta.
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <Button onClick={() => navigate('/login')}>Iniciar Sesión</Button>
          <Button variant="outline" onClick={() => navigate('/register')}>Registrarse</Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Error al cargar las órdenes</h1>
        <p className="text-muted-foreground mt-2">No pudimos cargar tu historial de pedidos.</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  const ordenes = data?.data || []
  const meta = data?.meta

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mis Órdenes</h1>

      <div className="flex items-center gap-4 mb-6">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value === 'all' ? '' : value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente_pago">Pendiente de Pago</SelectItem>
            <SelectItem value="pagada">Pagada</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="entregada">Entregada</SelectItem>
            <SelectItem value="cancelado">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : ordenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">No tienes órdenes aún</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Cuando realices una compra, tu historial de pedidos aparecerá aquí.
          </p>
          <Button className="mt-6" onClick={() => navigate('/catalogo')}>
            Explorar Catálogo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {ordenes.map((orden) => (
            <Link key={orden.id} to={`/mis-ordenes/${orden.numero}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">#{orden.numero}</span>
                        <Badge className={ORDER_STATUS_COLORS[orden.estado] || 'bg-gray-100'}>
                          {orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(orden.createdAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {orden.items?.length || 0} {orden.items?.length === 1 ? 'artículo' : 'artículos'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">{formatCurrency(orden.total)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage((prev) => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                  let pageNum: number
                  if (meta.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= meta.totalPages - 2) {
                    pageNum = meta.totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}