import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/uiStore'
import { useCartStore } from '@/stores/cartStore'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'

export function CartDrawer() {
  const isCartOpen = useUIStore((state) => state.isCartOpen)
  const closeCart = useUIStore((state) => state.closeCart)
  const items = useCartStore((state) => state.items)

  return (
    <Dialog open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <DialogContent className="flex h-full flex-col p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito de compras
          </DialogTitle>
          <DialogDescription>
            {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">Tu carrito está vacío</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega productos para comenzar
            </p>
            <Button onClick={closeCart} className="mt-6" asChild>
              <Link to="/productos">Ver productos</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem
                    key={`${item.idProducto}-${item.idAtributo || 'default'}`}
                    item={item}
                  />
                ))}
              </div>
            </div>

            <div className="border-t p-4">
              <CartSummary />
              <div className="mt-4 space-y-2">
                <Button asChild className="w-full">
                  <Link to="/carrito" onClick={closeCart}>
                    Ir al carrito
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/checkout" onClick={closeCart}>
                    Finalizar compra
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
