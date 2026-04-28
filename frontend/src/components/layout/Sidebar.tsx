import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PackageSearch,
  Users,
  BarChart3,
  ChevronLeft,
  Menu,
  X,
  TrendingUp,
  ClipboardList,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  roles: string[]
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { name: 'Panel Ventas', href: '/admin/dashboard-ventas', icon: TrendingUp, roles: ['ADMIN', 'GERENTEVENTAS'] },
  { name: 'Panel Inventario', href: '/admin/dashboard-inventario', icon: PackageSearch, roles: ['ADMIN', 'GERENTEINVENTARIO'] },
  { name: 'Panel Vendedor', href: '/admin/dashboard-vendedor', icon: ClipboardList, roles: ['ADMIN', 'VENDEDOR'] },
  { name: 'Productos', href: '/admin/productos', icon: Package, roles: ['ADMIN', 'VENDEDOR'] },
  { name: 'Órdenes', href: '/admin/ordenes', icon: ShoppingCart, roles: ['ADMIN', 'VENDEDOR', 'GERENTEVENTAS'] },
  { name: 'Inventario', href: '/admin/inventario', icon: PackageSearch, roles: ['ADMIN', 'GERENTEINVENTARIO'] },
  { name: 'Clientes', href: '/admin/clientes', icon: Users, roles: ['ADMIN'] },
  { name: 'Reportes', href: '/admin/reportes', icon: BarChart3, roles: ['ADMIN'] },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuthStore()

  const userRoles = user?.roles || []

  const filteredNavItems = navItems.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  )

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full bg-card border-r border-border z-50
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!isCollapsed && (
              <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                <Package className="h-6 w-6 text-primary" />
                <span>Admin</span>
              </Link>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                <ChevronLeft
                  className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-md hover:bg-accent transition-colors lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors
                    ${active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border">
            {!isCollapsed && (
              <p className="text-xs text-muted-foreground text-center">
                v1.0.0
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}