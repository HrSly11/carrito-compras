import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import {
  getAll,
  getById,
  getSegmentos,
  search,
} from '../controllers/cliente.controller.js';

const router = Router();

router.get('/', authenticate(), requireRole('ADMIN', 'GERENTEVENTAS', 'VENDEDOR'), getAll);
router.get('/buscar', authenticate(), search);
router.get('/segmentos', authenticate(), requireRole('ADMIN', 'GERENTEVENTAS'), getSegmentos);
router.get('/:id', authenticate(), getById);

export default router;