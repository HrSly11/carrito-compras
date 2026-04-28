import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Check, Lock } from 'lucide-react'
import ordenService from '@/services/orden.service'
import authService from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const guestSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  telefono: z.string().min(9, 'Teléfono inválido'),
})

const addressSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  apellido: z.string().min(2, 'El apellido es requerido'),
  direccion: z.string().min(5, 'La dirección es requerida'),
  ciudad: z.string().min(2, 'La ciudad es requerida'),
  departamento: z.string().min(2, 'El departamento es requerido'),
  codigo_postal: z.string().min(4, 'Código postal inválido'),
  telefono: z.string().min(9, 'Teléfono inválido'),
})

type LoginForm = z.infer<typeof loginSchema>
type GuestForm = z.infer<typeof guestSchema>
type AddressForm = z.infer<typeof addressSchema>

const STEPS = [
  { id: 1, title: 'Identificación' },
  { id: 2, title: 'Dirección' },
  { id: 3, title: 'Método Envío' },
  { id: 4, title: 'Pago' },
  { id: 5, title: 'Confirmar' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { user, isAuthenticated, accessToken } = useAuthStore()
  const { items, getTotal, clearCart, setIdCarrito } = useCartStore()

  useEffect(() => {
    const loadCarrito = async () => {
      if (isAuthenticated && user && !useCartStore.getState().idCarrito && accessToken) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/carrito`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          })
          if (response.ok) {
            const data = await response.json()
            if (data.data?.carrito?.id) {
              setIdCarrito(data.data.carrito.id)
            }
          }
        } catch (error) {
          console.error('Error loading carrito:', error)
        }
      }
    }
    loadCarrito()
  }, [isAuthenticated, user, accessToken, setIdCarrito])

  const [step, setStep] = useState(1)
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'guest' | 'authenticated'>(
    isAuthenticated ? 'guest' : 'guest'
  )
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<number | null>(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null)
  const [addressData, setAddressData] = useState<AddressForm | null>(null)
  const [paymentFieldsFilled, setPaymentFieldsFilled] = useState(false)

  const shippingMethods = [
    { id: 1, nombre: 'Estándar', descripcion: '5-7 días hábiles', precio: 15 },
    { id: 2, nombre: 'Express', descripcion: '2-3 días hábiles', precio: 30 },
    { id: 3, nombre: 'Premium', descripcion: '1 día hábil', precio: 50 },
  ]

  const paymentMethods = [
    { id: 1, nombre: 'Tarjeta de Crédito/Débito', descripcion: 'Visa, Mastercard, AMEX' },
    { id: 2, nombre: 'Yape/Plin', descripcion: 'Pago instantáneo' },
    { id: 3, nombre: 'Transferencia Bancaria', descripcion: 'BCP, BBVA, Interbank' },
    { id: 4, nombre: 'Contra Entrega', descripcion: 'Paga al recibir tu pedido' },
  ]

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const guestForm = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
  })

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  })

  const handleLogin = async (data: LoginForm) => {
    try {
      const userData = await authService.login(data.email, data.password)
      useAuthStore.getState().setAuth(
        {
          id: userData.user.id,
          email: userData.user.email,
          nombre: userData.user.nombre,
          apellido: userData.user.apellido,
          roles: [userData.user.rol],
        },
        userData.accessToken
      )
      localStorage.setItem('accessToken', userData.accessToken)
      localStorage.setItem('refreshToken', userData.refreshToken)
      toast.success('Sesión iniciada correctamente')
      setAuthMode('authenticated')

      const storedCart = useCartStore.getState()
      if (storedCart.items.length > 0 && !storedCart.idCarrito) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/carrito`, {
            headers: {
              'Authorization': `Bearer ${userData.accessToken}`,
            },
          })
          const responseData = await response.json()
          if (responseData.data?.carrito?.id) {
            setIdCarrito(responseData.data.carrito.id)
          }
        } catch (error) {
          console.error('Error loading carrito after login:', error)
        }
      }
    } catch {
      toast.error('Credenciales incorrectas')
    }
  }

  const handleGuestSubmit = (_data: GuestForm) => {
    toast.success('Continuando como invitado')
    setStep(2)
  }

  const handleAddressSubmit = (data: AddressForm) => {
    setAddressData(data)
    setStep(3)
  }

  const handleCreateOrder = async () => {
    if (!selectedShippingMethodId || !selectedPaymentMethodId || !addressData) {
      toast.error('Completa todos los campos')
      return
    }

    const { items: cartItems } = useCartStore.getState()

    if (cartItems.length === 0) {
      toast.error('No hay productos en el carrito')
      return
    }

    try {
      const ordenData = {
        items: cartItems.map((item) => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          nombre: item.nombre,
        })),
        direccionEnvio: {
          nombre: addressData.nombre,
          apellido: addressData.apellido,
          direccion: addressData.direccion,
          ciudad: addressData.ciudad,
          departamento: addressData.departamento,
          codigoPostal: addressData.codigo_postal,
          telefono: addressData.telefono,
        },
        idMetodoEnvio: selectedShippingMethodId,
        idMetodoPago: selectedPaymentMethodId,
      }

      await ordenService.createOrdenDirect(ordenData)
      clearCart()
      toast.success('¡Pedido creado exitosamente!')
      navigate('/mis-ordenes')
    } catch {
      toast.error('Error al crear el pedido')
    }
  }

  const subtotal = getTotal()
  const selectedShipping = shippingMethods.find((m) => m.id === selectedShippingMethodId)
  const shippingCost = selectedShipping?.precio || 0
  const igv = subtotal * 0.18
  const total = subtotal + igv + shippingCost

  const canProceed = () => {
    switch (step) {
      case 1:
        return isAuthenticated || authMode !== 'login'
      case 2:
        return true
      case 3:
        return selectedShippingMethodId !== null
      case 4:
        return selectedPaymentMethodId !== null && paymentFieldsFilled
      default:
        return true
    }
  }

  const handleNext = () => {
    if (canProceed()) {
      setStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="text-muted-foreground mt-2">Agrega productos antes de proceder al pago.</p>
        <Button className="mt-4" onClick={() => navigate('/catalogo')}>
          Ver Catálogo
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Pago seguro
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s.id ? <Check className="h-5 w-5" /> : s.id}
              </div>
              <span className={`ml-2 text-sm hidden sm:block ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`w-12 sm:w-24 h-1 mx-2 ${step > s.id ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Identificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isAuthenticated ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">
                      Sesión iniciada: {user?.email}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Continúa con tu pedido</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4 mb-6">
                      <Button
                        variant={authMode === 'guest' ? 'default' : 'outline'}
                        onClick={() => setAuthMode('guest')}
                      >
                        Comprar como invitado
                      </Button>
                      <Button
                        variant={authMode === 'login' ? 'default' : 'outline'}
                        onClick={() => setAuthMode('login')}
                      >
                        Iniciar Sesión
                      </Button>
                      <Button
                        variant={authMode === 'register' ? 'default' : 'outline'}
                        onClick={() => setAuthMode('register')}
                      >
                        Registrarse
                      </Button>
                    </div>

                    {authMode === 'login' && (
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            {...loginForm.register('email')}
                          />
                          {loginForm.formState.errors.email && (
                            <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="password">Contraseña</Label>
                          <Input
                            id="password"
                            type="password"
                            {...loginForm.register('password')}
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        <Button type="submit" className="w-full">
                          Iniciar Sesión
                        </Button>
                      </form>
                    )}

                    {authMode === 'guest' && (
                      <form onSubmit={guestForm.handleSubmit(handleGuestSubmit)} className="space-y-4">
                        <div>
                          <Label htmlFor="guest-name">Nombre completo</Label>
                          <Input
                            id="guest-name"
                            {...guestForm.register('nombre')}
                          />
                          {guestForm.formState.errors.nombre && (
                            <p className="text-sm text-red-500 mt-1">{guestForm.formState.errors.nombre.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="guest-email">Email</Label>
                          <Input
                            id="guest-email"
                            type="email"
                            {...guestForm.register('email')}
                          />
                          {guestForm.formState.errors.email && (
                            <p className="text-sm text-red-500 mt-1">{guestForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="guest-phone">Teléfono</Label>
                          <Input
                            id="guest-phone"
                            {...guestForm.register('telefono')}
                          />
                          {guestForm.formState.errors.telefono && (
                            <p className="text-sm text-red-500 mt-1">{guestForm.formState.errors.telefono.message}</p>
                          )}
                        </div>
                        <Button type="submit" className="w-full">
                          Continuar
                        </Button>
                      </form>
                    )}

                    {authMode === 'register' && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          ¿Prefieres crear una cuenta?
                        </p>
                        <Button onClick={() => navigate('/register')}>
                          Crear Cuenta
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        placeholder="Juan"
                        {...addressForm.register('nombre')}
                      />
                      {addressForm.formState.errors.nombre && (
                        <p className="text-sm text-red-500 mt-1">{addressForm.formState.errors.nombre.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input
                        id="apellido"
                        placeholder="Pérez"
                        {...addressForm.register('apellido')}
                      />
                      {addressForm.formState.errors.apellido && (
                        <p className="text-sm text-red-500 mt-1">{addressForm.formState.errors.apellido.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      placeholder="Av. Principal 123"
                      {...addressForm.register('direccion')}
                    />
                    {addressForm.formState.errors.direccion && (
                      <p className="text-sm text-red-500 mt-1">{addressForm.formState.errors.direccion.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        placeholder="Lima"
                        {...addressForm.register('ciudad')}
                      />
                      {addressForm.formState.errors.ciudad && (
                        <p className="text-sm text-red-500 mt-1">{addressForm.formState.errors.ciudad.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="department">Departamento</Label>
                      <Input
                        id="department"
                        placeholder="Lima"
                        {...addressForm.register('departamento')}
                      />
                      {addressForm.formState.errors.departamento && (
                        <p className="text-sm text-red-500 mt-1">{addressForm.formState.errors.departamento.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal">Código Postal</Label>
                      <Input
                        id="postal"
                        placeholder="15001"
                        {...addressForm.register('codigo_postal')}
                      />
                      {addressForm.formState.errors.codigo_postal && (
                        <p className="text-sm text-red-500 mt-1">{addressForm.formState.errors.codigo_postal.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        placeholder="987654321"
                        {...addressForm.register('telefono')}
                      />
                      {addressForm.formState.errors.telefono && (
                        <p className="text-sm text-red-500 mt-1">{addressForm.formState.errors.telefono.message}</p>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Guardar y Continuar
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Método de Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shippingMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedShippingMethodId === method.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={method.id}
                        checked={selectedShippingMethodId === method.id}
                        onChange={() => setSelectedShippingMethodId(method.id)}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="font-medium">{method.nombre}</p>
                        <p className="text-sm text-muted-foreground">{method.descripcion}</p>
                      </div>
                    </div>
                    <span className="font-semibold">{formatCurrency(method.precio)}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Método de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethodId === method.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPaymentMethodId === method.id}
                      onChange={() => {
                        setSelectedPaymentMethodId(method.id)
                        setPaymentFieldsFilled(false)
                      }}
                      className="h-4 w-4 mr-4"
                    />
                    <div>
                      <p className="font-medium">{method.nombre}</p>
                      <p className="text-sm text-muted-foreground">{method.descripcion}</p>
                    </div>
                  </label>
                ))}

                {selectedPaymentMethodId && !paymentFieldsFilled && (
                  <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                    {selectedPaymentMethodId === 1 && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Ingresa los datos de tu tarjeta (solo simulación):</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                            <Input id="cardNumber" placeholder="4532 1234 5678 9012" />
                          </div>
                          <div>
                            <Label htmlFor="cardHolder">Nombre en Tarjeta</Label>
                            <Input id="cardHolder" placeholder="JUAN PEREZ" />
                          </div>
                          <div>
                            <Label htmlFor="cardExpiry">Fecha Vencimiento</Label>
                            <Input id="cardExpiry" placeholder="MM/YY" />
                          </div>
                          <div>
                            <Label htmlFor="cardCvv">CVV</Label>
                            <Input id="cardCvv" placeholder="123" type="password" />
                          </div>
                        </div>
                        <Button onClick={() => setPaymentFieldsFilled(true)} className="w-full">
                          Continuar con el pago
                        </Button>
                      </div>
                    )}

                    {selectedPaymentMethodId === 2 && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Escanea el código QR con Yape o Plin (solo simulación):</p>
                        <div className="flex justify-center p-4">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center">
                            <span className="text-4xl">📱</span>
                          </div>
                        </div>
                        <Input placeholder="Ingresa tu número de celular para Yape/Plin" />
                        <Button onClick={() => setPaymentFieldsFilled(true)} className="w-full">
                          Continuar con el pago
                        </Button>
                      </div>
                    )}

                    {selectedPaymentMethodId === 3 && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Ingresa los datos de transferencia (solo simulación):</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="bankName">Banco</Label>
                            <Input id="bankName" placeholder="BCP, BBVA, Interbank" />
                          </div>
                          <div>
                            <Label htmlFor="accountNumber">Número de Cuenta</Label>
                            <Input id="accountNumber" placeholder="1234567890123456" />
                          </div>
                          <div>
                            <Label htmlFor="cciNumber">CCI</Label>
                            <Input id="cciNumber" placeholder="00212312312312312357" />
                          </div>
                          <div>
                            <Label htmlFor="transferHolder">Nombre</Label>
                            <Input id="transferHolder" placeholder="Nombre del titular" />
                          </div>
                        </div>
                        <Button onClick={() => setPaymentFieldsFilled(true)} className="w-full">
                          Continuar con el pago
                        </Button>
                      </div>
                    )}

                    {selectedPaymentMethodId === 4 && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">El pago se realizará al momento de la entrega (solo simulación).</p>
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-700">Ten en cuenta que el pago contra entrega puede tener un recargo adicional.</p>
                        </div>
                        <Button onClick={() => setPaymentFieldsFilled(true)} className="w-full">
                          Continuar con el pago
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {selectedPaymentMethodId && paymentFieldsFilled && (
                  <div className="mt-6 p-4 border border-green-200 rounded-lg bg-green-50">
                    <p className="text-green-700 font-medium flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Datos de pago ingresados correctamente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmar Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Dirección de Envío</h3>
                  <p className="text-sm text-muted-foreground">
                    {addressData ? `${addressData.nombre} ${addressData.apellido}, ${addressData.direccion}, ${addressData.ciudad}, ${addressData.departamento} ${addressData.codigo_postal}` : '-'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Método de Envío</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedShipping?.nombre} - {selectedShipping?.descripcion}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Método de Pago</h3>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethods.find((m) => m.id === selectedPaymentMethodId)?.nombre}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Resumen del Pedido</h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={`${item.idProducto}-${item.idAtributo || 'default'}`} className="flex justify-between text-sm">
                        <span>{item.nombre} x{item.cantidad}</span>
                        <span>{formatCurrency(item.cantidad * item.precioUnitario)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={handleCreateOrder}>
                  Confirmar Pedido - {formatCurrency(total)}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
            {step < 5 && (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Tu Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.idProducto}-${item.idAtributo || 'default'}`} className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      {item.imagen && (
                        <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.nombre}</p>
                      <p className="text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(item.cantidad * item.precioUnitario)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IGV (18%)</span>
                  <span>{formatCurrency(igv)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}