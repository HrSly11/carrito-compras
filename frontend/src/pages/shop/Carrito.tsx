import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import { CartItem } from '@/components/carrito/CartItem'
import { CartSummary } from '@/components/carrito/CartSummary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Carrito() {
  const navigate = useNavigate()
  const { items, clearCart, getTotal } = useCartStore()
  const total = getTotal()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            No has agregado productos a tu carrito. Explora nuestro catálogo y encuentra algo que te guste.
          </p>
          <Button className="mt-6" onClick={() => navigate('/catalogo')}>
            Ver Catálogo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Carrito de Compras</h1>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm('¿Estás seguro de vaciar el carrito?')) {
              clearCart()
            }
          }}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Vaciar carrito
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Productos ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <CartItem key={`${item.idProducto}-${item.idAtributo || 'default'}`} item={item} />
              ))}
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => navigate('/catalogo')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continuar Comprando
          </Button>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CartSummary />

              <div className="pt-4 border-t">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">{formatCurrency(total * 1.18)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/checkout')}
                >
                  Proceder al Pago
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Impuestos incluidos. Envío calculado al finalizar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}