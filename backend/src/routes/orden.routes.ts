import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import {
  create,
  createDirect,
  getMisOrdenes,
  getEstados,
  getById,
  getByNumero,
  getAll,
  updateEstado,
  cancelar,
} from '../controllers/orden.controller.js';

const router = Router();

router.post('/', authenticate(), create);
router.post('/directo', authenticate(), createDirect);
router.get('/mis-ordenes', authenticate(), getMisOrdenes);
router.get('/estados', getEstados);
router.get('/numero/:numero', authenticate(), getByNumero);
router.get('/', authenticate(), requireRole('ADMIN', 'GERENTEVENTAS'), getAll);
router.get('/:id', authenticate(), getById);
router.patch('/:id/estado', authenticate(), requireRole('ADMIN', 'GERENTEVENTAS'), updateEstado);
router.post('/:id/cancelar', authenticate(), cancelar);

export default router;