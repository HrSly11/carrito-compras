import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import {
  getStock,
  getStockProducto,
  getMovimientos,
  getAlertas,
  getValorizado,
  createAjuste,
  getAjustes,
  approveAjuste,
  getStats,
} from '../controllers/inventario.controller.js';

const router = Router();

router.get('/stock', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getStock);
router.get('/stock/producto/:id', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getStockProducto);
router.get('/movimientos', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getMovimientos);
router.get('/alertas', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getAlertas);
router.get('/stats', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getStats);
router.get('/valorizado', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getValorizado);
router.post('/ajustes', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), createAjuste);
router.get('/ajustes', authenticate(), requireRole('ADMIN', 'GERENTEINVENTARIO'), getAjustes);
router.post('/ajustes/:id/approve', authenticate(), requireRole('ADMIN'), approveAjuste);

export default router;