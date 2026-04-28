import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import OrdenService from '../services/orden.service';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  sendUnauthorized,
  buildPaginationMeta,
} from '../utils/response.util';

const ordenIdSchema = z.object({
  id: z.string().uuid(),
});

const ordenNumeroSchema = z.object({
  numero: z.string().min(1).max(50),
});

const createOrdenSchema = z.object({
  idCarrito: z.number().int().positive(),
  direccionEnvio: z.object({
    nombre: z.string().min(1).max(100),
    apellido: z.string().min(1).max(100),
    direccion: z.string().min(1).max(255),
    ciudad: z.string().min(1).max(100),
    departamento: z.string().min(1).max(100).optional(),
    codigoPostal: z.string().min(1).max(20),
    telefono: z.string().min(1).max(20),
  }),
  idMetodoEnvio: z.number().int().positive(),
  idMetodoPago: z.number().int().positive(),
  notas: z.string().max(500).optional(),
});

const createOrdenDirectSchema = z.object({
  items: z.array(z.object({
    idProducto: z.coerce.number().int().positive(),
    cantidad: z.coerce.number().int().positive(),
    precioUnitario: z.coerce.number().positive(),
    nombre: z.string().min(1).max(200),
  })).min(1),
  direccionEnvio: z.object({
    nombre: z.string().min(1).max(100),
    apellido: z.string().min(1).max(100),
    direccion: z.string().min(1).max(255),
    ciudad: z.string().min(1).max(100),
    departamento: z.string().min(1).max(100).optional(),
    codigoPostal: z.string().min(1).max(20),
    telefono: z.string().min(1).max(20),
  }),
  idMetodoEnvio: z.coerce.number().int().positive(),
  idMetodoPago: z.coerce.number().int().positive(),
  notas: z.string().max(500).optional(),
}).transform((data) => ({
  ...data,
  direccionEnvio: {
    ...data.direccionEnvio,
    codigo_postal: data.direccionEnvio.codigoPostal,
  },
}));

const updateEstadoSchema = z.object({
  estado: z.enum(['pendiente_pago', 'pagada', 'en_proceso', 'enviada', 'entregada', 'cancelado']),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  estado: z.enum(['pendiente_pago', 'pagada', 'en_proceso', 'enviada', 'entregada', 'cancelado']).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
});

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const data = createOrdenSchema.parse(req.body);
    const orden = await OrdenService.createOrdenFromCarrito(
      data.idCarrito,
      data.direccionEnvio,
      data.idMetodoEnvio,
      data.idMetodoPago
    );
    sendCreated(res, orden, 'Order created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function createDirect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const data = createOrdenDirectSchema.parse(req.body);
    console.log('[createDirect] data:', JSON.stringify(data, null, 2));
    const orden = await OrdenService.createOrdenDirect(
      req.user.id,
      data.items,
      data.direccionEnvio,
      data.idMetodoEnvio,
      data.idMetodoPago
    );
    sendCreated(res, orden, 'Order created successfully');
  } catch (error) {
    console.error('[createDirect] Error:', error);
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = ordenIdSchema.parse(req.params);
    const orden = await OrdenService.getOrdenById(parseInt(id));
    if (!orden) {
      sendNotFound(res, 'Order not found');
      return;
    }
    sendSuccess(res, orden, 'Order retrieved successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendBadRequest(res, 'Invalid order ID format');
      return;
    }
    next(error);
  }
}

export async function getByNumero(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { numero } = ordenNumeroSchema.parse(req.params);
    const orden = await OrdenService.getOrdenByNumero(numero);
    if (!orden) {
      sendNotFound(res, 'Order not found');
      return;
    }
    sendSuccess(res, orden, 'Order retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMisOrdenes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const validatedQuery = paginationSchema.parse(req.query);
    const result = await OrdenService.getOrdenesByUsuario(req.user.id, {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      estado: validatedQuery.estado,
    });
    const meta = buildPaginationMeta(validatedQuery.page, validatedQuery.limit, result.total);
    sendSuccess(res, result.ordenes, 'Orders retrieved successfully', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('[DEBUG] getAll called!');
    const validatedQuery = paginationSchema.parse(req.query);
    const result = await OrdenService.getAllOrdenes({
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      estado: validatedQuery.estado,
      fechaDesde: validatedQuery.fechaDesde,
      fechaHasta: validatedQuery.fechaHasta,
    });
    const meta = buildPaginationMeta(validatedQuery.page, validatedQuery.limit, result.total);
    sendSuccess(res, result.ordenes, 'Orders retrieved successfully', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function updateEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = ordenIdSchema.parse(req.params);
    const data = updateEstadoSchema.parse(req.body);
    const orden = await OrdenService.updateEstadoOrden(parseInt(id), data.estado, req.user?.id || 0);
    if (!orden) {
      sendNotFound(res, 'Order not found');
      return;
    }
    sendSuccess(res, orden, 'Order status updated');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function cancelar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    const { id } = ordenIdSchema.parse(req.params);
    const orden = await OrdenService.cancelarOrden(parseInt(id), req.user.id);
    if (!orden) {
      sendNotFound(res, 'Order not found');
      return;
    }
    sendSuccess(res, orden, 'Order cancelled successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendBadRequest(res, 'Invalid order ID format');
      return;
    }
    if (error instanceof Error) {
      sendBadRequest(res, error.message);
      return;
    }
    next(error);
  }
}

export async function getEstados(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estados = await OrdenService.getEstadosOrden();
    sendSuccess(res, estados, 'Order states retrieved');
  } catch (error) {
    next(error);
  }
}
