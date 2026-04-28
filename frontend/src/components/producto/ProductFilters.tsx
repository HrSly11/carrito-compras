import { useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Category {
  id: number
  nombre: string
  slug: string
}

interface Brand {
  id: number
  nombre: string
  slug: string
}

interface ProductFiltersProps {
  categories?: Category[]
  brands?: Brand[]
}

export function ProductFilters({ categories = [], brands = [] }: ProductFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [localCategoria, setLocalCategoria] = useState(searchParams.get('categoria') || '')
  const [localMarca, setLocalMarca] = useState(searchParams.get('marca') || '')
  const [localPrecioMin, setLocalPrecioMin] = useState(searchParams.get('precioMin') || '')
  const [localPrecioMax, setLocalPrecioMax] = useState(searchParams.get('precioMax') || '')

  useEffect(() => {
    setLocalCategoria(searchParams.get('categoria') || '')
    setLocalMarca(searchParams.get('marca') || '')
    setLocalPrecioMin(searchParams.get('precioMin') || '')
    setLocalPrecioMax(searchParams.get('precioMax') || '')
  }, [searchParams])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (localCategoria) params.set('categoria', localCategoria)
    if (localMarca) params.set('marca', localMarca)
    if (localPrecioMin) params.set('precioMin', localPrecioMin)
    if (localPrecioMax) params.set('precioMax', localPrecioMax)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setLocalCategoria('')
    setLocalMarca('')
    setLocalPrecioMin('')
    setLocalPrecioMax('')
    setSearchParams(new URLSearchParams())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters()
    }
  }

  const hasActiveFilters =
    localCategoria || localMarca || localPrecioMin || localPrecioMax

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <select
            value={localCategoria}
            onChange={(e) => setLocalCategoria(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Marca</label>
          <select
            value={localMarca}
            onChange={(e) => setLocalMarca(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las marcas</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Rango de precio</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={localPrecioMin}
              onChange={(e) => setLocalPrecioMin(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="number"
              placeholder="Máx"
              value={localPrecioMax}
              onChange={(e) => setLocalPrecioMax(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <Button onClick={applyFilters} className="w-full">
          Aplicar filtros
        </Button>
      </div>
    </div>
  )
}
