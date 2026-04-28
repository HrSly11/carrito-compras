import { Router } from 'express';
import { default as authRoutes } from './auth.routes.js';
import { default as productoRoutes } from './producto.routes.js';
import { default as carritoRoutes } from './carrito.routes.js';
import { default as ordenRoutes } from './orden.routes.js';
import { default as inventarioRoutes } from './inventario.routes.js';
import { default as clienteRoutes } from './cliente.routes.js';
import { default as reporteRoutes } from './reporte.routes.js';
import { default as uploadRoutes } from './upload.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/carrito', carritoRoutes);
router.use('/ordenes', ordenRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/clientes', clienteRoutes);
router.use('/reportes', reporteRoutes);
router.use('/uploads', uploadRoutes);

export const routes = router;

