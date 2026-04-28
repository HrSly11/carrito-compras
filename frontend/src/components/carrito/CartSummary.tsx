import { useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const IGV_RATE = 0.18

export function CartSummary() {
  const items = useCartStore((state) => state.items)
  const [cuponCode, setCuponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [isApplyingCupon, setIsApplyingCupon] = useState(false)

  const subtotal = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
  const igv = subtotal * IGV_RATE
  const total = subtotal + igv - discount

  const handleApplyCupon = async () => {
    if (!cuponCode.trim()) return

    setIsApplyingCupon(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setDiscount(subtotal * 0.1)
    } catch {
      setDiscount(0)
    } finally {
      setIsApplyingCupon(false)
    }
  }

  const handleRemoveCupon = () => {
    setCuponCode('')
    setDiscount(0)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">IGV (18%)</span>
          <span>{formatCurrency(igv)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Código de cupón"
            value={cuponCode}
            onChange={(e) => setCuponCode(e.target.value.toUpperCase())}
            disabled={discount > 0}
          />
          {discount > 0 ? (
            <Button variant="outline" onClick={handleRemoveCupon}>
              Quitar
            </Button>
          ) : (
            <Button onClick={handleApplyCupon} disabled={isApplyingCupon || !cuponCode.trim()}>
              {isApplyingCupon ? 'Aplicando...' : 'Aplicar'}
            </Button>
          )}
        </div>
        {discount > 0 && (
          <p className="text-xs text-green-600">Código aplicado: 10% de descuento</p>
        )}
      </div>
    </div>
  )
}
