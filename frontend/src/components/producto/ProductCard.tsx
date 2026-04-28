import { Link } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import { IProducto } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cartStore'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: IProducto
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [isAdding, setIsAdding] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const mainImage = product.imagenes?.find((img) => img.es_principal) || product.imagenes?.[0]
  const imageUrl = mainImage?.url || '/placeholder.png'
  const hasDiscount = product.precio_oferta !== undefined && product.precio_oferta > 0
  const isOutOfStock = product.stock === 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) return

    setIsAdding(true)
    try {
      addItem({
        idProducto: product.id,
        nombre: product.nombre,
        cantidad: 1,
        precioUnitario: hasDiscount ? product.precio_oferta! : product.precio_venta,
        imagen: imageUrl,
      })
      toast.success('Producto agregado al carrito')
    } catch {
      toast.error('Error al agregar producto')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toast.success('Producto agregado a favoritos')
  }

  return (
    <Link
      to={`/productos/${product.slug}`}
      className="group block"
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
    >
      <div
        className={`
          relative overflow-hidden rounded-xl border bg-card
          transition-all duration-200 ease-out
          group-hover:shadow-medium group-hover:border-primary/20
          ${isPressed ? 'scale-[0.98] shadow-soft' : 'shadow-soft hover:shadow-medium'}
        `}
      >
        {hasDiscount && !isOutOfStock && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Oferta
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Sin stock
          </div>
        )}
        <button
          onClick={handleAddToWishlist}
          className="absolute right-3 top-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-2 opacity-0 shadow-sm transition-all duration-200 hover:bg-background hover:scale-110 focus:opacity-100 group-hover:opacity-100 ring-2 ring-transparent focus:ring-primary/50"
          aria-label="Agregar a favoritos"
        >
          <Heart className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
        </button>
        <div className="aspect-square overflow-hidden bg-muted/50">
          <img
            src={imageUrl}
            alt={product.nombre}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-primary uppercase tracking-wide">{product.categoria?.nombre}</p>
          <h3 className="mt-1 font-semibold text-base line-clamp-2 text-foreground leading-tight">{product.nombre}</h3>
          {product.marca && (
            <p className="mt-1 text-xs text-muted-foreground">{product.marca.nombre}</p>
          )}
          <div className="mt-3 flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-red-500">
                  {formatCurrency(product.precio_oferta!)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.precio_venta)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-foreground">{formatCurrency(product.precio_venta)}</span>
            )}
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="mt-4 w-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            size="sm"
          >
            {isAdding ? (
              <span className="animate-pulse">Agregando...</span>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Link>
  )
}