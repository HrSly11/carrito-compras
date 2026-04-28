import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import InventarioService from '../services/inventario.service';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  buildPaginationMeta,
} from '../utils/response.util';

const stringToNumber = (v: any, fallback: number) => {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

const stringToBoolean = (v: any) => {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
};

const stockQuerySchema = z.object({
  page: z.string().optional().transform(v => stringToNumber(v, 1)),
  limit: z.string().optional().transform(v => stringToNumber(v, 50)),
  categoria: z.string().optional().transform(v => v ? Number(v) : undefined),
  marca: z.string().optional().transform(v => v ? Number(v) : undefined),
  conStockBajo: z.string().optional().transform(v => stringToBoolean(v)),
  stockCero: z.string().optional().transform(v => stringToBoolean(v)),
});

const productoIdSchema = z.object({
  id: z.string().min(1),
});

const movimientosQuerySchema = z.object({
  page: z.any(),
  limit: z.any(),
  tipo: z.string().optional(),
  productoId: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
});

const createAjusteSchema = z.object({
  productoId: z.coerce.number().int().min(1),
  tipo: z.string().min(1),
  cantidad: z.number().int().min(1),
  motivo: z.string().min(1).max(500),
  referencia: z.string().max(100).optional(),
});

const ajusteIdSchema = z.object({
  id: z.string().min(1),
});

export async function getStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = stockQuerySchema.parse(req.query);
    const result = await InventarioService.getAllStock({
      page: query.page,
      limit: query.limit,
      categoria: query.categoria,
      marca: query.marca,
      stockBajo: query.conStockBajo,
      stockCero: query.stockCero,
    });
    const meta = buildPaginationMeta(query.page, query.limit, result.total);
    sendSuccess(res, result.stock, 'Stock retrieved successfully', 200, meta);
  } catch (error: any) {
    console.error('[getStock] error:', error.message || error);
    next(error);
  }
}

export async function getStockProducto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = productoIdSchema.parse(req.params);
    const stock = await InventarioService.getStockActual(parseInt(id));
    sendSuccess(res, stock, 'Product stock retrieved');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendBadRequest(res, 'Invalid product ID format');
      return;
    }
    next(error);
  }
}

export async function getMovimientos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawQuery = req.query;
    console.log('[getMovimientos] raw query:', rawQuery);

    const page = Number(rawQuery.page) || 1;
    const limit = Number(rawQuery.limit) || 10;
    const tipo = rawQuery.tipo as string | undefined;
    const productoId = rawQuery.productoId ? parseInt(rawQuery.productoId as string) : undefined;
    const fechaDesde = rawQuery.fechaDesde as string | undefined;
    const fechaHasta = rawQuery.fechaHasta as string | undefined;

    const result = await InventarioService.getMovimientosInventario({
      page,
      limit,
      tipo,
      idProducto: productoId,
      fechaDesde,
      fechaHasta,
    });
    const meta = buildPaginationMeta(page, limit, result.total);
    sendSuccess(res, result.movimientos, 'Movement history retrieved', 200, meta);
  } catch (error: any) {
    console.error('[getMovimientos] Error:', error.message || error);
    next(error);
  }
}

export async function getAlertas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alertas = await InventarioService.getAlertaStockBajo();
    sendSuccess(res, alertas, 'Stock alerts retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('[InventarioController] getStats called, user roles:', req.user?.roles);
    const stats = await InventarioService.getEstadisticas();
    console.log('[InventarioController] getStats success, stats keys:', Object.keys(stats));
    sendSuccess(res, stats, 'Inventory stats retrieved');
  } catch (error) {
    console.log('[InventarioController] getStats error:', error);
    next(error);
  }
}

export async function getValorizado(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const valorizado = await InventarioService.getValorizadoPorCategoria();
    sendSuccess(res, valorizado, 'Inventory valuation retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createAjuste(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createAjusteSchema.parse(req.body);
    const ajuste = await InventarioService.createAjuste(
      data.motivo,
      [{
        id_producto: parseInt(data.productoId),
        cantidad_anterior: 0,
        cantidad_nueva: data.cantidad,
        diferencia: data.cantidad,
      }],
      req.user?.id || 0
    );
    sendCreated(res, ajuste, 'Adjustment created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function getAjustes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ajustes = await InventarioService.getAjustesPendientes();
    sendSuccess(res, ajustes, 'Adjustments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function approveAjuste(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = ajusteIdSchema.parse(req.params);
    const ajuste = await InventarioService.approveAjuste(parseInt(id), req.user?.id || 0);
    if (!ajuste) {
      sendNotFound(res, 'Adjustment not found or already approved');
      return;
    }
    sendSuccess(res, ajuste, 'Adjustment approved successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendBadRequest(res, 'Invalid adjustment ID format');
      return;
    }
    next(error);
  }
}
