import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import productoService from '@/services/producto.service'
import categoriaService from '@/services/categoria.service'
import { ProductGrid } from '@/components/producto/ProductGrid'
import { Button } from '@/components/ui/button'

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriaService.getCategorias(),
    staleTime: 1000 * 60 * 5,
  })

  const { data: marcasData } = useQuery({
    queryKey: ['marcas'],
    queryFn: () => categoriaService.getMarcas(),
    staleTime: 1000 * 60 * 5,
  })

  const categories = categoriasData || []
  const brands = marcasData || []

  const page = parseInt(searchParams.get('page') || '1', 10)
  const categoria = searchParams.get('categoria') || undefined
  const marca = searchParams.get('marca') || undefined
  const precioMin = searchParams.get('precioMin') ? parseFloat(searchParams.get('precioMin')!) : undefined
  const precioMax = searchParams.get('precioMax') ? parseFloat(searchParams.get('precioMax')!) : undefined
  const busqueda = searchParams.get('busqueda') || undefined

  const params = {
    page,
    limit: 12,
    categoria,
    marca,
    precioMin,
    precioMax,
    busqueda,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['productos', searchParams.toString()],
    queryFn: () => productoService.getProductos(params),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
  })

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', newPage.toString())
    setSearchParams(newParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters = categoria || marca || precioMin || precioMax || busqueda

  const meta = data?.meta

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Catálogo</h1>
          {meta && (
            <p className="text-muted-foreground mt-1">{meta.total} productos encontrados</p>
          )}
        </div>
        <Button
          variant="outline"
          className="lg:hidden"
          onClick={() => setIsMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6 p-6 bg-card rounded-xl border border-border">
            <FilterSection title="Categoría">
              <div className="space-y-1">
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams)
                    params.delete('categoria')
                    setSearchParams(params)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !categoria ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Todas las categorías
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams)
                      params.set('categoria', cat.slug)
                      setSearchParams(params)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      categoria === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </FilterSection>

            <div className="border-t border-border" />

            <FilterSection title="Marca">
              <div className="space-y-1">
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams)
                    params.delete('marca')
                    setSearchParams(params)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !marca ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Todas las marcas
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand.slug}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams)
                      params.set('marca', brand.slug)
                      setSearchParams(params)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      marca === brand.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {brand.nombre}
                  </button>
                ))}
              </div>
            </FilterSection>

            <div className="border-t border-border" />

            <FilterSection title="Rango de Precio">
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={precioMin || ''}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams)
                    if (e.target.value) {
                      params.set('precioMin', e.target.value)
                    } else {
                      params.delete('precioMin')
                    }
                    setSearchParams(params)
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={precioMax || ''}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams)
                    if (e.target.value) {
                      params.set('precioMax', e.target.value)
                    } else {
                      params.delete('precioMax')
                    }
                    setSearchParams(params)
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </FilterSection>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="w-full text-muted-foreground">
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </aside>

        <main className="flex-1">
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {categoria && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {categories.find(c => c.slug === categoria)?.nombre || categoria}
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams)
                      params.delete('categoria')
                      setSearchParams(params)
                    }}
                    className="hover:text-primary/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {marca && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {brands.find(b => b.slug === marca)?.nombre || marca}
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams)
                      params.delete('marca')
                      setSearchParams(params)
                    }}
                    className="hover:text-primary/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {busqueda && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  "{busqueda}"
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams)
                      params.delete('busqueda')
                      setSearchParams(params)
                    }}
                    className="hover:text-primary/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          <ProductGrid
            products={(data?.data || []) as any}
            loading={isLoading}
          />

          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={!meta.hasPrevPage}
                onClick={() => handlePageChange(page - 1)}
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
                      onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {meta && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Mostrando {((page - 1) * 12) + 1} - {Math.min(page * 12, meta.total)} de {meta.total} productos
            </p>
          )}
        </main>
      </div>

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-background p-6 overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <FilterSection title="Categoría">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams)
                      params.delete('categoria')
                      setSearchParams(params)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !categoria ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Todas las categorías
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set('categoria', cat.slug)
                        setSearchParams(params)
                        setIsMobileFiltersOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        categoria === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <div className="border-t border-border pt-6">
                <FilterSection title="Marca">
                  <div className="space-y-1">
                    {brands.map((brand) => (
                      <button
                        key={brand.slug}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams)
                          params.set('marca', brand.slug)
                          setSearchParams(params)
                          setIsMobileFiltersOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          marca === brand.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {brand.nombre}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>

              {hasActiveFilters && (
                <div className="pt-6 border-t border-border">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}