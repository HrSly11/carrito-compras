import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import {
  getVentas,
  getOrdenes,
  getInventario,
  getStockAlertas,
  getClientes,
  getRentabilidad,
  getVentasCategoria,
  getComportamiento,
  getPdfReporte,
} from '../controllers/reporte.controller.js';

const router = Router();

router.get('/ventas', authenticate(), requireRole('ADMIN', 'GERENTEVENTAS'), getVentas);
router.get('/ordenes', authenticate(), requireRole('ADMIN', 'GERENTEVENTAS'), getOrdenes);
router.get('/inventario', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getInventario);
router.get('/stock_alertas', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getStockAlertas);
router.get('/clientes', authenticate(), requireRole('ADMIN', 'GERENTEVENTAS'), getClientes);
router.get('/rentabilidad', authenticate(), requireRole('ADMIN'), getRentabilidad);
router.get('/ventas_categoria', authenticate(), requireRole('ADMIN', 'GERENTEVENTAS'), getVentasCategoria);
router.get('/comportamiento', authenticate(), requireRole('ADMIN'), getComportamiento);
router.get('/:type/pdf', authenticate(), requireRole('ADMIN'), getPdfReporte);

export default router;