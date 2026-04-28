import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Mail, Check, Sparkles } from 'lucide-react'
import productoService from '@/services/producto.service'
import { ProductGrid } from '@/components/producto/ProductGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function Home() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const { data: productosData, isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productoService.getProductos({ limit: 8 }),
  })

  const productosDestacados = productosData?.data || []

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Ingresa tu correo electrónico')
      return
    }
    if (!email.includes('@')) {
      toast.error('Ingresa un correo válido')
      return
    }
    setIsSubscribed(true)
    toast.success('¡Suscrito al newsletter!')
    setEmail('')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-background py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
                <Sparkles className="h-4 w-4" />
                Nuevos productos cada semana
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
                Bienvenido a <span className="text-primary">Carrito Compras</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-md leading-relaxed">
                Descubre miles de productos de las mejores marcas. Compara precios,
                lee reseñas y compra con confianza.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate('/catalogo')} className="transition-all hover:scale-105 active:scale-95">
                  Ver Catálogo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/catalogo?destacado=true')} className="transition-all hover:scale-105 active:scale-95">
                  Productos Destacados
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl transform rotate-3" />
              <img
                src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600"
                alt="Shopping experience"
                className="relative rounded-3xl shadow-medium object-cover aspect-[4/3]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Productos Destacados</h2>
              <p className="text-muted-foreground mt-1">Los más vendidos esta semana</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/catalogo')} className="transition-all hover:scale-105">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <ProductGrid
            products={(productosDestacados || []) as any}
            loading={isLoading}
          />
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Explora por Categoría</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Electrónica', slug: 'electronica', emoji: '📱' },
              { name: 'Ropa', slug: 'ropa', emoji: '👕' },
              { name: 'Hogar', slug: 'hogar', emoji: '🏠' },
              { name: 'Deportes', slug: 'deportes', emoji: '⚽' },
            ].map((cat, i) => (
              <Link
                key={cat.slug}
                to={`/catalogo?categoria=${cat.slug}`}
                className="group animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-medium group-hover:border-primary/30 group-hover:-translate-y-1">
                  <div className="aspect-square overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300">
                      {cat.emoji}
                    </div>
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{cat.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-foreground/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Suscríbete a nuestro Newsletter</h2>
            <p className="text-primary-foreground/80">
              Recibe ofertas exclusivas, nuevos productos y consejos de compra directamente en tu correo.
            </p>
            {isSubscribed ? (
              <div className="flex items-center justify-center gap-2 text-green-300 animate-fade-in">
                <Check className="h-5 w-5" />
                <span className="font-medium">¡Gracias por suscribirte!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Suscribirme
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}