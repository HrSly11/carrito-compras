# 🚨 Guía de Solución de Problemas - Carrito de Compras

Este documento documenta todos los errores encontrados durante el desarrollo y sus soluciones para facilitar el despliegue en nuevas máquinas.

---

## 📋 Índice de Problemas

1. [Configuración de Base de Datos PostgreSQL](#1-configuración-de-base-de-datos-postgresql)
2. [Instalación de Dependencias](#2-instalación-de-dependencias)
3. [Errores de Compilación TypeScript](#3-errores-de-compilación-typescript)
4. [Error 500 en Generación de PDF](#4-error-500-en-generación-de-pdf)
5. [Error 400 en Reportes PDF](#5-error-400-en-reportes-pdf)
6. [Error 400 en Creación de Productos con Imágenes](#6-error-400-en-creación-de-productos-con-imágenes)
7. [Conflictos de Puerto](#7-conflictos-de-puerto)
8. [Problemas con Variables de Entorno](#8-problemas-con-variables-de-entorno)

---

## 1. Configuración de Base de Datos PostgreSQL

### ❌ Error:
```
Error: password authentication failed for user "postgres"
```

### 🔧 Solución:
1. **Actualizar contraseña en backend/.env:**
   ```env
   DATABASE_URL="postgresql://postgres:12345@localhost:5432/carrito_compras"
   ```

2. **Configurar PostgreSQL con contraseña '12345':**
   ```bash
   # En Windows (PostgreSQL instalado localmente)
   # Abrir pgAdmin y cambiar contraseña del usuario postgres a '12345'
   
   # O via SQL:
   ALTER USER postgres PASSWORD '12345';
   ```

3. **Verificar conexión:**
   ```bash
   cd backend
   npx prisma db pull
   ```

---

## 2. Instalación de Dependencias

### ❌ Error:
```
npm ERR! peer dep missing: react@^18.0.0
```

### 🔧 Solución:
1. **Limpiar caché de npm:**
   ```bash
   npm cache clean --force
   ```

2. **Instalar dependencias por separado:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Si persiste el error, usar --force:**
   ```bash
   npm install --force
   ```

---

## 3. Errores de Compilación TypeScript

### ❌ Error 1: Decimal no encontrado
```
Cannot find name 'Decimal' or 'Decimal' is declared but its value is never read
```

### 🔧 Solución:
1. **Remover import de Decimal en servicios:**
   ```typescript
   // Antes:
   import { PrismaClient, Decimal } from '@prisma/client';
   
   // Después:
   import { PrismaClient } from '@prisma/client';
   ```

2. **Reemplazar uso de Decimal con números:**
   ```typescript
   // Antes:
   const total = new Decimal(orden.total);
   
   // Después:
   const total = Number(orden.total);
   ```

### ❌ Error 2: Includes inválidos en Prisma
```
Object literal may only specify known properties, and 'usuario' does not exist in type
```

### 🔧 Solución:
1. **Verificar schema.prisma para relaciones válidas:**
   ```bash
   cd backend
   npx prisma studio
   ```

2. **Remover includes no existentes:**
   ```typescript
   // Antes:
   include: { usuario: true, unidad_medida: true }
   
   // Después:
   include: { categoria: true }
   ```

### ❌ Error 3: Campos null vs undefined
```
Type 'null' is not assignable to type 'number | undefined'
```

### 🔧 Solución:
```typescript
// Antes:
id_usuario: carrito.id_usuario || null

// Después:
id_usuario: carrito.id_usuario || 0
```

---

## 4. Error 500 en Generación de PDF

### ❌ Error:
```
Error: Could not find Chrome (errno: -2)
PuppeteerError: Failed to launch chrome
```

### 🔧 Solución:
1. **Instalar Chrome para Puppeteer:**
   ```bash
   cd backend
   npx puppeteer browsers install chrome
   ```

2. **Verificar instalación:**
   ```bash
   npx puppeteer browsers list
   ```

3. **Si el error persiste, reinstalar puppeteer:**
   ```bash
   npm uninstall puppeteer
   npm install puppeteer
   npx puppeteer browsers install chrome
   ```

---

## 5. Error 400 en Reportes PDF

### ❌ Error:
```
GET /api/v1/reportes/ordenes/pdf 400 (Bad Request)
Tipo de reporte 'ordenes' no soportado para PDF
```

### 🔧 Solución:
1. **Agregar soporte para 'ordenes' en reporte.controller.ts:**
   ```typescript
   switch (type) {
     case 'ordenes': {
       const ordenes = await prisma.ord_ordenes.findMany({
         where: {
           fecha_creacion: {
             gte: periodo.inicio,
             lte: periodo.fin,
           },
         },
         include: { usuario: true },
         orderBy: { fecha_creacion: 'desc' },
       });
       
       const totalVentas = ordenes.reduce((sum, o) => sum + Number(o.total), 0);
       pdfBuffer = await pdfGestion.generateVentasReport(ordenes, totalVentas, periodo);
       break;
     }
     // ... otros casos
   }
   ```

---

## 6. Error 400 en Creación de Productos con Imágenes

### ❌ Error:
```
POST /api/v1/productos 400 (Bad Request)
```

### 🔧 Solución:
1. **Agregar middleware de upload a rutas de productos:**
   ```typescript
   // backend/src/routes/producto.routes.ts
   import { uploadProductImage } from '../middlewares/upload.middleware.js';
   
   router.post('/', authenticate(), requireRole('ADMIN'), uploadProductImage, create);
   router.put('/:id', authenticate(), requireRole('ADMIN'), uploadProductImage, update);
   ```

2. **Actualizar controller para manejar archivos:**
   ```typescript
   // backend/src/controllers/producto.controller.ts
   export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
     try {
       const data = createProductoSchema.parse(req.body);
       
       // Handle image from multer upload
       let imagenUrl: string | undefined;
       if (req.file) {
         imagenUrl = `/uploads/productos/${req.file.filename}`;
       }
       
       const productoData: any = {
         nombre: data.nombre,
         // ... otros campos
         imagenes: imagenUrl ? [{ url: imagenUrl, es_principal: true }] : undefined,
       };
       
       const producto = await ProductoService.createProducto(productoData);
       sendCreated(res, producto, 'Product created successfully');
     } catch (error) {
       // ... manejo de errores
     }
   }
   ```

3. **Extender tipo Request para incluir archivo:**
   ```typescript
   // Agregar al inicio del controller
   declare global {
     namespace Express {
       interface Request {
         file?: Express.Multer.File;
       }
     }
   }
   ```

---

## 7. Conflictos de Puerto

### ❌ Error:
```
Error: listen EADDRINUSE: address already in use :::3001
```

### 🔧 Solución:
1. **Encontrar proceso usando el puerto:**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Linux/Mac
   lsof -i :3001
   ```

2. **Terminar el proceso:**
   ```bash
   # Windows (reemplazar PID con el ID del proceso)
   taskkill /F /PID <PID>
   
   # Linux/Mac
   kill -9 <PID>
   ```

3. **O cambiar el puerto en .env:**
   ```env
   PORT=3002
   ```

---

## 8. Problemas con Variables de Entorno

### ❌ Error:
```
Error: DATABASE_URL is not set
JWT_SECRET is not defined
```

### 🔧 Solución:
1. **Crear archivo .env en backend:**
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:12345@localhost:5432/carrito_compras"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_EXPIRES_IN="7d"
   
   # Server
   PORT=3001
   NODE_ENV="development"
   
   # CORS
   FRONTEND_URL="http://localhost:5173"
   ```

2. **Crear archivo .env en frontend:**
   ```env
   VITE_API_URL="http://localhost:3001/api/v1"
   VITE_APP_NAME="Carrito de Compras"
   ```

---

## 🚀 Pasos para Despliegue en Nueva Máquina

### 1. Clonar Repositorio
```bash
git clone https://github.com/HrSly11/carrito-compras.git
cd carrito-compras
```

### 2. Configurar PostgreSQL
```bash
# Instalar PostgreSQL
# Crear base de datos 'carrito_compras'
# Configurar usuario 'postgres' con contraseña '12345'
```

### 3. Backend Setup
```bash
cd backend
npm install

# Configurar .env (ver sección 8)
npx prisma generate
npx prisma db push
npx prisma db seed

# Instalar Chrome para PDFs
npx puppeteer browsers install chrome

# Iniciar backend
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install

# Configurar .env (ver sección 8)
npm run dev
```

### 5. Verificación Final
- Backend: http://localhost:3001
- Frontend: http://localhost:5173
- Test login: admin@carrito.com / Admin123
- Test creación de producto con imagen
- Test generación de reportes PDF

---

## 📞 Contacto de Soporte

Si encuentras un error no documentado aquí, por favor:
1. Revisa los logs del backend y frontend
2. Verifica que todos los pasos de configuración se completaron
3. Abre un issue en el repositorio de GitHub

---

## 📝 Notas Adicionales

- **Chrome/Puppeteer**: Es necesario para generación de PDFs. Debe instalarse en cada nueva máquina.
- **Base de Datos**: La contraseña '12345' es para desarrollo. Cambiar en producción.
- **JWT Secret**: Generar un nuevo secreto para producción.
- **Imágenes**: Las carpetas de uploads deben tener permisos de escritura.
- **Ports**: Asegurar que los puertos 3001 y 5173 estén disponibles.
