import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Minus, Plus, Heart, ShoppingCart, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import productoService from '@/services/producto.service'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductGrid } from '@/components/producto/ProductGrid'
import toast from 'react-hot-toast'

export default function ProductoDetalle() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const { data: producto, isLoading, error } = useQuery({
    queryKey: ['producto', slug],
    queryFn: () => productoService.getProductoBySlug(slug!),
    enabled: !!slug,
  })

  const { data: productosRelacionados } = useQuery({
    queryKey: ['productos-relacionados', producto?.categoria?.id],
    queryFn: () => productoService.getProductos({ categoria: producto?.categoria?.slug, limit: 4 }),
    enabled: !!producto?.categoria?.id,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-8 w-64 bg-gray-200 rounded" />
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-24 w-full bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !producto) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Producto no encontrado</h2>
        <p className="text-muted-foreground mt-2">El producto que buscas no existe o fue eliminado.</p>
        <Button className="mt-4" onClick={() => navigate('/catalogo')}>
          Ver Catálogo
        </Button>
      </div>
    )
  }

  const images = producto.imagenes || []
  const mainImage = images[selectedImageIndex]?.url || '/placeholder.png'
  const hasDiscount = producto.precio_oferta !== undefined && producto.precio_oferta > 0
  const isOutOfStock = producto.stock === 0

  const handleAddToCart = () => {
    if (isOutOfStock || isAdding) return

    setIsAdding(true)
    try {
      const itemToAdd = {
        idProducto: producto.id,
        nombre: producto.nombre,
        cantidad: quantity,
        precioUnitario: hasDiscount ? (producto.precio_oferta ?? producto.precio_venta) : producto.precio_venta,
        imagen: mainImage,
      }
      addItem(itemToAdd)
      toast.success(`${quantity} producto(s) agregado(s) al carrito`)
    } catch {
      toast.error('Error al agregar al carrito')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddToWishlist = () => {
    toast.success('Producto agregado a favoritos')
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, producto.stock)))
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/">Inicio</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/catalogo">Catálogo</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/catalogo?categoria=${producto.categoria?.slug}`}>{producto.categoria?.nombre}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{producto.nombre}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 mb-16">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-gray-100">
            <img
              src={mainImage}
              alt={producto.nombre}
              className="h-full w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            {hasDiscount && !isOutOfStock && (
              <Badge className="absolute top-4 left-4 bg-red-500">Oferta</Badge>
            )}
            {isOutOfStock && (
              <Badge className="absolute top-4 left-4 bg-gray-500">Sin Stock</Badge>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={img.id || index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${
                    index === selectedImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${producto.nombre} - ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{producto.categoria?.nombre}</p>
            <h1 className="text-3xl font-bold mt-1">{producto.nombre}</h1>
            {producto.marca && (
              <p className="text-muted-foreground mt-1">Marca: {producto.marca.nombre}</p>
            )}
          </div>

          <div className="flex items-baseline gap-4">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-bold text-red-500">
                  {formatCurrency(producto.precio_oferta!)}
                </span>
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(producto.precio_venta)}
                </span>
                <Badge variant="destructive">
                  -{Math.round((1 - producto.precio_oferta! / producto.precio_venta) * 100)}%
                </Badge>
              </>
            ) : (
              <span className="text-3xl font-bold">{formatCurrency(producto.precio_venta)}</span>
            )}
          </div>

          <p className="text-muted-foreground">{producto.descripcion_larga || producto.descripcion_corta}</p>

          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
              {isOutOfStock ? 'Sin stock' : `En stock (${producto.stock} unidades)`}
            </span>
          </div>

          {producto.atributos && producto.atributos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Atributos:</h3>
              <div className="flex flex-wrap gap-2">
                {producto.atributos.map((attr) => (
                  <Badge key={attr.id} variant="outline">
                    {attr.nombre}: {attr.valor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!isOutOfStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Cantidad:</span>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= producto.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isAdding ? 'Agregando...' : 'Agregar al Carrito'}
                </Button>
                <Button size="lg" variant="outline" onClick={handleAddToWishlist}>
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex flex-col items-center text-center gap-1 text-sm">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span>Envío Gratis</span>
              <span className="text-xs text-muted-foreground">En pedidos +199</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 text-sm">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span>Garantía</span>
              <span className="text-xs text-muted-foreground">30 días</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 text-sm">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              <span>Devoluciones</span>
              <span className="text-xs text-muted-foreground">Gratis</span>
            </div>
          </div>
        </div>
      </div>

      {productosRelacionados?.data && productosRelacionados.data.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Productos Relacionados</h2>
          <ProductGrid products={productosRelacionados.data as any} />
        </section>
      )}

      <section className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Reseñas de Clientes</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Las reseñas aún no están disponibles.</p>
          <p className="text-sm text-muted-foreground mt-1">Este producto aún no ha sido reseñado.</p>
        </div>
      </section>
    </div>
  )
}