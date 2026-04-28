import { Router } from 'express';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import {
  getCarrito,
  addItem,
  updateItem,
  removeItem,
  clearCarrito,
  applyCupon,
  removeCupon,
} from '../controllers/carrito.controller.js';

const router = Router();

router.get('/', optionalAuth, getCarrito);
router.post('/items', optionalAuth, addItem);
router.put('/items/:id', optionalAuth, updateItem);
router.delete('/items/:id', optionalAuth, removeItem);
router.delete('/', optionalAuth, clearCarrito);
router.post('/cupon', optionalAuth, applyCupon);
router.delete('/cupon', optionalAuth, removeCupon);

export default router;