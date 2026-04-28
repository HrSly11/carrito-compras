import { ReactNode } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/carrito/CartDrawer'

import Home from '@/pages/shop/Home'
import Catalogo from '@/pages/shop/Catalogo'
import ProductoDetalle from '@/pages/shop/ProductoDetalle'
import Carrito from '@/pages/shop/Carrito'
import Checkout from '@/pages/shop/Checkout'
import MisOrdenes from '@/pages/shop/MisOrdenes'
import MisOrdenDetalle from '@/pages/shop/MisOrdenDetalle'
import Perfil from '@/pages/shop/Perfil'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

import DashboardAdmin from '@/pages/admin/DashboardAdmin'
import DashboardGerenteVentas from '@/pages/admin/DashboardGerenteVentas'
import DashboardGerenteInventario from '@/pages/admin/DashboardGerenteInventario'
import DashboardVendedor from '@/pages/admin/DashboardVendedor'
import ProductosAdmin from '@/pages/admin/ProductosAdmin'
import OrdenesAdmin from '@/pages/admin/OrdenesAdmin'
import InventarioAdmin from '@/pages/admin/InventarioAdmin'
import ClientesAdmin from '@/pages/admin/ClientesAdmin'
import Reportes from '@/pages/admin/Reportes'
import Estadisticas from '@/pages/admin/Estadisticas'

function ShopLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

function AdminLayout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-64">
        <Outlet />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<ShopLayout><Home /></ShopLayout>} />
        <Route path="/catalogo" element={<ShopLayout><Catalogo /></ShopLayout>} />
        <Route path="/producto/:slug" element={<ShopLayout><ProductoDetalle /></ShopLayout>} />
        <Route path="/carrito" element={<ShopLayout><Carrito /></ShopLayout>} />
        <Route path="/checkout" element={<ShopLayout><Checkout /></ShopLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/mis-ordenes"
          element={
            <ProtectedRoute>
              <ShopLayout><MisOrdenes /></ShopLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-ordenes/:numero"
          element={
            <ProtectedRoute>
              <ShopLayout><MisOrdenDetalle /></ShopLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ShopLayout><Perfil /></ShopLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard-ventas"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'GERENTEVENTAS']}>
                <DashboardGerenteVentas />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard-inventario"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'GERENTEINVENTARIO']}>
                <DashboardGerenteInventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard-vendedor"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'VENDEDOR']}>
                <DashboardVendedor />
              </ProtectedRoute>
            }
          />
          <Route
            path="productos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'VENDEDOR']}>
                <ProductosAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="ordenes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'VENDEDOR']}>
                <OrdenesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventario"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'INVENTARIO']}>
                <InventarioAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="clientes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ClientesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="reportes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Reportes />
              </ProtectedRoute>
            }
          />
          <Route
            path="estadisticas"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'VENDEDOR']}>
                <Estadisticas />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
