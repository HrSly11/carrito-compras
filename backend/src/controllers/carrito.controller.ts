import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import CarritoService from '../services/carrito.service';
import ProductoService from '../services/producto.service';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  sendUnauthorized,
} from '../utils/response.util';

const addItemSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().min(1),
});

const updateItemSchema = z.object({
  cantidad: z.number().int().min(1),
});

const itemIdSchema = z.object({
  id: z.string().uuid(),
});

const cuponSchema = z.object({
  codigo: z.string().min(1).max(50),
});

export async function getCarrito(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const carrito = await CarritoService.getCarrito(req.user.id);
    sendSuccess(res, carrito, 'Cart retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const data = addItemSchema.parse(req.body);
    const carrito = await CarritoService.getCarrito(req.user.id, null);
    const producto = await ProductoService.getProductoById(parseInt(data.productoId));
    const item = await CarritoService.addItem(carrito.id, parseInt(data.productoId), data.cantidad, producto.precio_venta);
    sendCreated(res, item, 'Item added to cart');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const { id } = itemIdSchema.parse(req.params);
    const data = updateItemSchema.parse(req.body);
    const carrito = await CarritoService.getCarrito(req.user.id, null);
    const item = await CarritoService.updateItemCantidad(parseInt(id), data.cantidad);
    sendSuccess(res, item, 'Cart item updated');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const { id } = itemIdSchema.parse(req.params);
    await CarritoService.removeItem(parseInt(id));
    sendSuccess(res, null, 'Item removed from cart');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendBadRequest(res, 'Invalid item ID format');
      return;
    }
    next(error);
  }
}

export async function clearCarrito(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const carrito = await CarritoService.getCarrito(req.user.id, null);
    await CarritoService.clearCarrito(carrito.id);
    sendSuccess(res, null, 'Cart cleared successfully');
  } catch (error) {
    next(error);
  }
}

export async function applyCupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const data = cuponSchema.parse(req.body);
    const carrito = await CarritoService.getCarrito(req.user.id, null);
    const result = await CarritoService.applyCupon(carrito.id, data.codigo);
    sendSuccess(res, result, 'Coupon applied successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    if (error instanceof Error && error.message === 'Coupon not found or expired') {
      sendBadRequest(res, error.message);
      return;
    }
    next(error);
  }
}

export async function removeCupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const carrito = await CarritoService.getCarrito(req.user.id, null);
    await CarritoService.removeCupon(carrito.id);
    sendSuccess(res, null, 'Coupon removed from cart');
  } catch (error) {
    next(error);
  }
}
