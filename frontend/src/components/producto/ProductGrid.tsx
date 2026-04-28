import { IProducto } from '@/types'
import { ProductCard } from './ProductCard'
import { Package } from 'lucide-react'

interface ProductGridProps {
  products: IProducto[]
  loading?: boolean
}

function ProductSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-card">
      <div className="aspect-square bg-muted/50" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-6 w-20 rounded bg-muted" />
        <div className="h-10 w-full rounded-lg bg-muted" />
      </div>
    </div>
  )
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  const productos = Array.isArray(products) ? products : []

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">No se encontraron productos</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Intenta con otros filtros o búsqueda para encontrar lo que buscas.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {productos.map((product, index) => (
        <div
          key={product.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}