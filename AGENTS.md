# Carrito Compras - Agents Guide

## Project Structure
- **Backend**: `backend/` - Express + Prisma + PostgreSQL (port 3001)
- **Frontend**: `frontend/` - React + Vite + React Query (port 5173)

## Common Commands
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Re-seed database (after changing seed.ts)
cd backend && npx prisma db seed
```

## Database
- PostgreSQL password: `12345`
- Connection: `postgresql://postgres:12345@localhost:5432/carrito_compras`

## Test Credentials
| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@carrito.com | Admin123 |
| Cliente | cliente@carrito.com | Cliente123 |
| GerenteVentas | gerente.ventas@carrito.com | GerenteVentas123 |
| GerenteInventario | gerente.inventario@carrito.com | GerenteInventario123 |
| Vendedor | vendedor@carrito.com | Vendedor123 |

## API Response Format
Backend wraps responses: `{ success: true, message: "...", data: [...], meta?: {...} }`
Frontend service layer extracts: `response.data.data` and `response.data.meta`

## API Base Path
- Backend API base: `/api/v1` (e.g., `/api/v1/ordenes`, `/api/v1/productos`)
- Frontend env: `VITE_API_URL=http://localhost:3001/api/v1`

## Order Creation Flow
**Endpoint**: POST `/api/v1/ordenes/directo`

**Request payload**:
```json
{
  "items": [{ "idProducto": 1, "cantidad": 2, "precioUnitario": 29.99, "nombre": "Producto" }],
  "direccionEnvio": {
    "nombre": "Juan",
    "apellido": "Pérez",
    "direccion": "Av. Principal 123",
    "ciudad": "Lima",
    "departamento": "Lima",
    "codigoPostal": "15001",
    "telefono": "987654321"
  },
  "idMetodoEnvio": 1,
  "idMetodoPago": 1
}
```

## Order States (snake_case)
`pendiente_pago`, `pagada`, `en_proceso`, `enviada`, `entregada`, `cancelado`

**NEVER use**: `PENDIENTE`, `PAGADA`, `CONFIRMADA`, `COMPLETADA` (these do not exist)

## Known Issues Fixed
1. **Category filter returns 400**: Backend service converts slug→ID internally. producto.service.ts uses `categoria?: string` (slug), not number.
2. **Express route order**: Specific routes must be declared BEFORE `/:id` otherwise Express captures them as IDs. Order routes should be: `/estados`, `/numero/:numero`, `/:id`, `/` (generic GET all)
3. **Zod validation errors**: The controller passes query params directly to service without schema validation to avoid "Datos de entrada inválidos" errors.
4. **Image URLs**: Run `npx prisma db seed` after modifying seed image URLs to update the database.
5. **Order creation 400 error**: Fixed schema mismatch - backend expects `direccionEnvio` object, not `idDireccionEnvio`. Added `idCarrito`, `idMetodoEnvio`, `idMetodoPago` to request body.
6. **Order states enum mismatch**: Backend uses `pendiente_pago`, `pagada`, etc. NOT `PENDIENTE`, `PAGADA`, etc. Always use snake_case states.

## Key Backend Patterns
- `ProductoService.getAllProductos()` performs slug-to-category lookup: `{ where: { slug: filters.categoria } }` then uses `categoria.id`
- `sendSuccess(res, data, message, 200, meta)` sends wrapped response with optional pagination meta
- `OrdenService.createOrdenDirect()` - creates order directly (simulated payment - order starts as `pagada`)
- Prisma Decimal fields come as strings, must parse to numbers: `parseFloat(o.total)` or `Number(o.total)`

## Frontend Field Mapping
Backend → Frontend field name mapping for orders:
- `numero_orden` → `numero`
- `estado_actual` → `estado`
- `fecha_creacion` → `createdAt`
- `fecha_actualizacion` → `updatedAt`

## Frontend Key Patterns
- `useQuery` queryKey should include `searchParams.toString()` to trigger refetch on param changes
- Navbar categories and catalog filters are now fetched dynamically from `/productos/categorias` and `/productos/marcas` (previously hardcoded)
- Frontend services extract response data via `response.data.data` (backend wraps all responses)

## Cart Synchronization
- Local cart store (`useCartStore`) holds items in memory with `idCarrito` for backend reference
- On login during checkout, fetch `/carrito` to get existing `idCarrito` from backend
- `idCarrito` is required for order creation (`POST /ordenes`)

## Seed Data
Products have placeholder images. To update image URLs after seed changes, either:
1. Re-run `npx prisma db seed`
2. Or run a direct Prisma script to update URLs without re-seeding

## Express Route Gotcha
Express matches routes in order of declaration. If `/:id` is declared before `/numero/:numero`, requests to `/ordenes/numero/XXX` will be captured by `/:id` as `id=numero/XXX`. Always put specific routes BEFORE generic parameterized routes.