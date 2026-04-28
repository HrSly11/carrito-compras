import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CreditCard, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import ordenService from '@/services/orden.service';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ORDER_STATUS_COLORS: Record<string, string> = {
  pendiente_pago: 'bg-yellow-100 text-yellow-800',
  pagada: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  enviada: 'bg-purple-100 text-purple-800',
  entregada: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const ORDER_STATUS_ICONS: Record<string, React.ReactNode> = {
  pendiente_pago: <Clock className="h-4 w-4" />,
  pagada: <CheckCircle className="h-4 w-4" />,
  en_proceso: <Package className="h-4 w-4" />,
  enviada: <Truck className="h-4 w-4" />,
  entregada: <CheckCircle className="h-4 w-4" />,
  cancelado: <XCircle className="h-4 w-4" />,
};

export default function MisOrdenDetalle() {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  const { data: orden, isLoading, error } = useQuery({
    queryKey: ['orden-detalle', numero],
    queryFn: () => ordenService.getOrdenByNumero(numero!),
    enabled: !!numero && isAuthenticated && _hasHydrated,
  });

  if (!_hasHydrated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (error || !orden) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Orden no encontrada</h1>
        <p className="text-muted-foreground mt-2">No pudimos encontrar esta orden.</p>
        <Button className="mt-4" onClick={() => navigate('/mis-ordenes')}>
          Volver a Mis Órdenes
        </Button>
      </div>
    );
  }

  const mainImage = orden.items?.[0]?.producto?.imagenes?.find((img: any) => img.es_principal)?.url ||
    orden.items?.[0]?.producto?.imagenes?.[0]?.url;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 pl-0" onClick={() => navigate('/mis-ordenes')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Mis Órdenes
      </Button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Orden #{orden.numero}</h1>
          <p className="text-muted-foreground mt-1">
            Creada el {formatDate(orden.createdAt)}
          </p>
        </div>
        <Badge className={`${ORDER_STATUS_COLORS[orden.estado] || 'bg-gray-100'} text-base px-4 py-2`}>
          {ORDER_STATUS_ICONS[orden.estado]}
          <span className="ml-2">{orden.estado.replace('_', ' ').charAt(0).toUpperCase() + orden.estado.replace('_', ' ').slice(1)}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orden.items?.map((item: any) => {
                  const itemImage = item.producto?.imagenes?.find((img: any) => img.es_principal)?.url ||
                    item.producto?.imagenes?.[0]?.url;
                  return (
                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                        {itemImage ? (
                          <img src={itemImage} alt={item.producto?.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.producto?.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.precio_unitario)} x {item.cantidad}
                        </p>
                        <p className="font-semibold mt-1">
                          {formatCurrency(item.precio_unitario * item.cantidad)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dirección de Envío
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orden.direccion_envio ? (
                <div className="space-y-1">
                  <p className="font-semibold">{orden.direccion_envio.nombre} {orden.direccion_envio.apellido}</p>
                  <p className="text-muted-foreground">{orden.direccion_envio.direccion}</p>
                  <p className="text-muted-foreground">
                    {orden.direccion_envio.ciudad}, {orden.direccion_envio.departamento} {orden.direccion_envio.codigo_postal}
                  </p>
                  <p className="text-muted-foreground">{orden.direccion_envio.telefono}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No disponible</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Método de Envío
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orden.metodo_envio ? (
                <div className="space-y-1">
                  <p className="font-semibold">{orden.metodo_envio.nombre}</p>
                  <p className="text-muted-foreground">{orden.metodo_envio.descripcion}</p>
                  <p className="text-sm text-muted-foreground">
                    Tiempo de entrega: {orden.metodo_envio.tiempo_entrega}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No disponible</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{orden.metodo_pago?.nombre || 'No disponible'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(orden.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGV (18%)</span>
                <span>{formatCurrency(orden.igv)}</span>
              </div>
              {orden.descuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-{formatCurrency(orden.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo de envío</span>
                <span>{formatCurrency(orden.metodo_envio?.precio || 0)}</span>
              </div>
              <hr />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatCurrency(orden.total)}</span>
              </div>
            </CardContent>
          </Card>

          {orden.notas && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{orden.notas}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}