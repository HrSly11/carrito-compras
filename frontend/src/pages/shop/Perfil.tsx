import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { User, MapPin, Lock, Package, ChevronRight } from 'lucide-react'
import authService from '@/services/auth.service'
import ordenService from '@/services/orden.service'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  apellido: z.string().min(2, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
})

const passwordSchema = z.object({
  oldPassword: z.string().min(6, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

type Tab = 'profile' | 'addresses' | 'password' | 'orders'

export default function Perfil() {
  const navigate = useNavigate()
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const { data: ordenesData } = useQuery({
    queryKey: ['mis-ordenes-resumen'],
    queryFn: () => ordenService.getMisOrdenes({ page: 1, limit: 5 }),
    enabled: isAuthenticated,
  })

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return { ...user, ...data }
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser as any)
      toast.success('Perfil actualizado correctamente')
    },
    onError: () => {
      toast.error('Error al actualizar el perfil')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await authService.changePassword(data.oldPassword, data.newPassword)
    },
    onSuccess: () => {
      toast.success('Contraseña cambiada correctamente')
      passwordForm.reset()
    },
    onError: () => {
      toast.error('Error al cambiar la contraseña')
    },
  })

  const handleProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data)
  }

  const handlePasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate(data)
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 mx-auto">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Inicia Sesión para Ver tu Perfil</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Para ver y editar tu perfil, necesitas iniciar sesión.
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <Button onClick={() => navigate('/login')}>Iniciar Sesión</Button>
          <Button variant="outline" onClick={() => navigate('/register')}>Registrarse</Button>
        </div>
      </div>
    )
  }

  const ordenes = ordenesData?.data || []
  const ordenesRecientes = ordenes.slice(0, 3)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <User className="h-5 w-5" />
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'addresses'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <MapPin className="h-5 w-5" />
              Direcciones
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'password'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'orders'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Package className="h-5 w-5" />
              Mis Órdenes
            </button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        {...profileForm.register('nombre')}
                      />
                      {profileForm.formState.errors.nombre && (
                        <p className="text-sm text-red-500">{profileForm.formState.errors.nombre.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input
                        id="apellido"
                        {...profileForm.register('apellido')}
                      />
                      {profileForm.formState.errors.apellido && (
                        <p className="text-sm text-red-500">{profileForm.formState.errors.apellido.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register('email')}
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono (opcional)</Label>
                    <Input
                      id="telefono"
                      {...profileForm.register('telefono')}
                    />
                  </div>

                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'addresses' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Direcciones de Envío</CardTitle>
                  <Button size="sm">
                    Agregar Nueva
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tienes direcciones guardadas.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Agrega una dirección para facilitar tus futuras compras.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'password' && (
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Contraseña Actual</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      {...passwordForm.register('oldPassword')}
                    />
                    {passwordForm.formState.errors.oldPassword && (
                      <p className="text-sm text-red-500">{passwordForm.formState.errors.oldPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register('newPassword')}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register('confirmPassword')}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Resumen de Órdenes</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/mis-ordenes')}>
                      Ver todas
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordenesRecientes.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tienes órdenes aún.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ordenesRecientes.map((orden) => (
                        <div
                          key={orden.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">#{orden.numero}</span>
                              <Badge variant="outline">{orden.estado}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(orden.createdAt)} • {orden.items?.length || 0} artículos
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(orden.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{ordenesData?.meta?.total || 0}</p>
                      <p className="text-sm text-muted-foreground">Pedidos</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          ordenes.reduce((sum, o) => sum + o.total, 0)
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Gastado</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {ordenes.filter((o) => o.estado === 'entregado').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Entregados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}