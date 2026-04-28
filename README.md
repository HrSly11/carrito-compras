# Carrito de Compras - Sistema E-Commerce

Sistema web completo de comercio electrónico con carrito de compras, gestión de inventario, administración de órdenes y panel de control.

## Tabla de Contenidos

- [Características](#características)
- [Tech Stack](#tech-stack)
- [Prerrequisitos](#prerrequisitos)
- [Instalación](#instalación)
- [Configuración del Entorno](#configuración-del-entorno)
- [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
- [Ejecución del Proyecto](#ejecución-del-proyecto)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación de la API](#documentación-de-la-api)
- [Opciones de Despliegue](#opciones-de-despliegue)
- [Pruebas](#pruebas)
- [Scripts Disponibles](#scripts-disponibles)

## Características

### Cliente
- Navegación por catálogo de productos con filtros y búsqueda
- Carrito de compras con gestión de cantidades
- Checkout con múltiples métodos de pago
- Gestión de perfil de usuario
- Historial de órdenes
- Lista de deseos
- Reseñas de productos

### Administración
- Dashboard con estadísticas de ventas
- Gestión completa de productos (CRUD)
- Gestión de categorías y subcategorías
- Control de inventario con movimientos
- Gestión de órdenes y estados
- Reportes y exportación a PDF
- Control de acceso basado en roles (RBAC)

### Seguridad
- Autenticación JWT con refresh tokens
- Protección CSRF y XSS
- Rate limiting
- Validación de datos con Zod
- Auditoría de transacciones

## Tech Stack

### Frontend
- **React 18** - Librería UI
- **TypeScript** - Lenguaje tipado
- **Vite** - Bundler y dev server
- **TailwindCSS** - Framework de estilos
- **Radix UI** - Componentes accesibles
- **React Router v6** - Enrutamiento
- **TanStack Query** - Gestión de estado servidor
- **Zustand** - Estado global
- **React Hook Form + Zod** - Formularios
- **Recharts** - Gráficos
- **Axios** - Cliente HTTP

### Backend
- **Node.js 20+** - Runtime
- **Express** - Framework API
- **TypeScript** - Lenguaje tipado
- **Prisma** - ORM
- **PostgreSQL 16+** - Base de datos
- **JWT** - Autenticación
- **Swagger/OpenAPI** - Documentación
- **Winston** - Logging
- **PDFKit** - Generación de PDFs
- **Zod** - Validación

## Prerrequisitos

- **Node.js**: 20.x o superior
- **npm**: 10.x o superior
- **PostgreSQL**: 16.x o superior
- **Git**: última versión

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd carrito-compras
```

### 2. Instalar dependencias del root

```bash
npm install
```

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 4. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

## Configuración del Entorno

### Variables de entorno del Backend

El proyecto ya incluye un archivo `.env` en la carpeta `backend/` con la configuración por defecto. Si necesitas cambiarla:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carrito_compras
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:5173
```

### Variables de entorno del Frontend

El frontend usa variables de Vite. Ya existe un archivo `.env` en la carpeta `frontend/`:

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## Configuración de la Base de Datos

### Configuración de PostgreSQL en Windows

1. **Verificar que PostgreSQL está corriendo:**
   ```powershell
   Get-Service | Where-Object { $_.Name -like "*postgres*" }
   ```

2. **Configurar contraseña del usuario postgres:**
   - Edita el archivo `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
   - Busca las líneas con "local" y "host" y cambia `scram-sha-256` a `trust` para conexiones locales:
   ```
   local   all             all                                     trust
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   ```
   - Reinicia el servicio PostgreSQL:
   ```powershell
   Restart-Service postgresql-x64-18
   ```

3. **Crear la base de datos:**
   ```powershell
   cd "C:\Program Files\PostgreSQL\18\bin"
   .\psql.exe -U postgres -c "CREATE DATABASE carrito_compras;"
   ```

### Push del esquema Prisma

La base de datos y tablas ya están creadas. Para sincronizar el esquema:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### Poblar datos de prueba (seed)

```bash
cd backend
npm run seed
```

**Datos creados:**
- 6 roles de usuario
- ~25 permisos
- 5 categorías con subcategorías
- 3 marcas
- 2 unidades de medida
- 2 monedas
- 24 productos con inventario
- 3 métodos de envío
- 3 métodos de pago
- 5 estados de orden
- Admin user: `admin@carrito.com` / `Admin123`

## Ejecución del Proyecto

### Build para Producción

```bash
npm run build
```

### Modo Desarrollo

Desde la raíz del proyecto:

```bash
npm run dev
```

O individualmente:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Documentación Swagger: http://localhost:3001/api/docs

### Modo Producción

```bash
npm run start
```

## Estructura del Proyecto

```
carrito-compras/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modelo de datos Prisma
│   │   └── seed.ts            # Datos iniciales
│   ├── src/
│   │   ├── config/            # Configuración de la app
│   │   ├── controllers/       # Controladores de rutas
│   │   ├── middlewares/       # Express middlewares
│   │   ├── routes/            # Definición de rutas
│   │   ├── services/          # Lógica de negocio
│   │   ├── schemas/           # Validación Zod
│   │   ├── types/             # Tipos TypeScript
│   │   ├── utils/             # Utilidades
│   │   ├── app.ts             # Configuración Express
│   │   └── index.ts           # Punto de entrada
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── ui/            # Componentes UI
│   │   │   ├── layout/       # Navbar, Footer, Sidebar
│   │   │   ├── producto/      # ProductCard, ProductGrid
│   │   │   ├── carrito/       # CartDrawer, CartItem
│   │   │   └── charts/       # Recharts components
│   │   ├── pages/             # Páginas/Rutas
│   │   │   ├── admin/         # Dashboard, Productos, Ordenes, etc.
│   │   │   ├── shop/          # Home, Catalogo, Carrito, Checkout
│   │   │   └── auth/          # Login, Register
│   │   ├── services/          # Llamadas API (axios)
│   │   ├── stores/            # Estado Zustand
│   │   ├── types/             # Tipos TypeScript
│   │   ├── utils/             # Utilidades
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── sql/
│   └── create_database.sql    # Script SQL completo
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

## Documentación de la API

La documentación de la API está disponible mediante Swagger UI:

**Desarrollo:** http://localhost:3001/api/docs

### Autenticación

La API usa JWT Bearer tokens. Incluir en las peticiones:

```
Authorization: Bearer <token>
```

### Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/v1/auth/register | Registro de usuario |
| POST | /api/v1/auth/login | Inicio de sesión |
| POST | /api/v1/auth/refresh | Refrescar token |
| GET | /api/v1/auth/me | Usuario actual |
| GET | /api/v1/productos | Listar productos |
| GET | /api/v1/productos/destacados | Productos destacados |
| GET | /api/v1/productos/slug/:slug | Detalle producto |
| GET | /api/v1/carrito | Obtener carrito |
| POST | /api/v1/carrito/items | Agregar al carrito |
| PUT | /api/v1/carrito/items/:id | Actualizar cantidad |
| DELETE | /api/v1/carrito/items/:id | Eliminar del carrito |
| POST | /api/v1/ordenes | Crear orden |
| GET | /api/v1/ordenes/mis-ordenes | Órdenes del usuario |
| GET | /api/v1/ordenes/:id | Detalle orden |
| PATCH | /api/v1/ordenes/:id/estado | Actualizar estado (admin) |
| GET | /api/v1/inventario/stock | Stock actual (admin) |
| GET | /api/v1/inventario/alertas | Alertas de stock bajo |

### Roles y Permisos

| Rol | Descripción |
|-----|-------------|
| Cliente | Usuario normal, puede comprar |
| Administrador | Acceso total |
| GerenteVentas | Dashboard, órdenes, reportes |
| GerenteInventario | Productos, inventario |
| Vendedor | Gestión de órdenes |

## Opciones de Despliegue

### Docker (Local)

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Vercel (Frontend)

1. Conectar repositorio a Vercel
2. Configurar directorio: `frontend`
3. Variables de entorno:
   - `VITE_API_URL`: URL del backend en producción

### Despliegue Backend

Opciones recomendadas:
- **Railway** - Soporte nativo de Node.js y PostgreSQL
- **Render** - Fácil configuración
- **AWS ECS/Beanstalk** - Enterprise
- **DigitalOcean App Platform** - Simple y económico

### Despliegue Database

- **Supabase** - PostgreSQL gestionado
- **Neon** - Serverless PostgreSQL
- **Railway** - PostgreSQL incluido
- **AWS RDS** - Enterprise

## Pruebas

### Backend

```bash
cd backend
npm run test
```

### Linting

```bash
# Todo el proyecto
npm run lint

# Solo backend
cd backend && npm run lint

# Solo frontend
cd frontend && npm run lint
```

## Scripts Disponibles

### Raíz (monorepo)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Iniciar backend y frontend en desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar en modo producción |
| `npm run install:all` | Instalar todas las dependencias |
| `npm run test` | Ejecutar pruebas del backend |
| `npm run lint` | Linting de todo el proyecto |

### Backend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Iniciar en desarrollo (tsx watch) |
| `npm run build` | Compilar TypeScript |
| `npm run start` | Iniciar producción |
| `npm run seed` | Poblar base de datos |
| `npm run migrate` | Crear migraciones Prisma |
| `npm run generate` | Generar cliente Prisma |
| `npm run lint` | ESLint |
| `npm run test` | Jest tests |

### Frontend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Dev server Vite |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | ESLint |

## Cuenta de Administrador

Para acceder al panel de administración:

- **Email:** admin@carrito.com
- **Contraseña:** Admin123

## Notas de Desarrollo

- El frontend está completamente construido en `frontend/dist/`
- El backend requiere TypeScript compilation antes de ejecutar en producción
- La base de datos ya está configurada con datos de prueba
- Swagger docs disponibles en `/api/docs` cuando el backend está corriendo

## Licencia

Privado - Todos los derechos reservados