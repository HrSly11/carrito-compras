import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CartItemProps {
  item: {
    idProducto: number
    nombre: string
    cantidad: number
    precioUnitario: number
    imagen?: string
    idAtributo?: number
  }
}

export function CartItem({ item }: CartItemProps) {
  const updateItem = useCartStore((state) => state.updateItem)
  const removeItem = useCartStore((state) => state.removeItem)

  const handleIncrement = () => {
    updateItem(item.idProducto, item.cantidad + 1)
  }

  const handleDecrement = () => {
    if (item.cantidad > 1) {
      updateItem(item.idProducto, item.cantidad - 1)
    } else {
      removeItem(item.idProducto)
    }
  }

  const handleRemove = () => {
    removeItem(item.idProducto)
  }

  const subtotal = item.cantidad * item.precioUnitario

  return (
    <div className="flex gap-4 rounded-lg border p-3">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        <img
          src={item.imagen || '/placeholder.png'}
          alt={item.nombre}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="line-clamp-2 text-sm font-medium">{item.nombre}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCurrency(item.precioUnitario)} c/u
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleDecrement}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.cantidad}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleIncrement}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <span className="font-semibold">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  )
}
