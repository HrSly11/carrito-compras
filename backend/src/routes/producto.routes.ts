import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { uploadProductImage } from '../middlewares/upload.middleware.js';
import {
  getAll,
  getById,
  getBySlug,
  create,
  update,
  remove,
  getDestacados,
  search,
  getCategorias,
  getMarcas,
} from '../controllers/producto.controller.js';

const router = Router();

router.get('/categorias', getCategorias);
router.get('/marcas', getMarcas);
router.get('/destacados', getDestacados);
router.get('/buscar', search);
router.get('/', getAll);
router.get('/:id', getById);
router.get('/slug/:slug', getBySlug);

router.post('/', authenticate(), requireRole('ADMIN'), uploadProductImage, create);
router.put('/:id', authenticate(), requireRole('ADMIN'), uploadProductImage, update);
router.delete('/:id', authenticate(), requireRole('ADMIN'), remove);

export default router;