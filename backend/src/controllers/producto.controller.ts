import { Request, Response, NextFunction } from 'express';

// Extend Request type to include file from multer
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}
import { z } from 'zod';
import ProductoService from '../services/producto.service';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  buildPaginationMeta,
} from '../utils/response.util';
import { paginationSchema } from '../schemas/producto.schema';

const productoIdSchema = z.object({
  id: z.string().uuid(),
});

const slugSchema = z.object({
  slug: z.string().min(1).max(200),
});

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
});

const createProductoSchema = z.object({
  nombre: z.string().min(2).max(200),
  slug: z.string().optional(),
  descripcion: z.string().optional(),
  precio: z.number().min(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional(),
  categoriaId: z.number().positive().optional(),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  imagenUrl: z.string().optional(),
});

const updateProductoSchema = createProductoSchema.partial();

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await ProductoService.getAllProductos({
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string || undefined,
      sortOrder: req.query.sortOrder as string || undefined,
      categoria: req.query.categoria as string || undefined,
      marca: req.query.marca as string || undefined,
      precioMin: req.query.precioMin ? parseFloat(req.query.precioMin as string) : undefined,
      precioMax: req.query.precioMax ? parseFloat(req.query.precioMax as string) : undefined,
      destacado: req.query.destacado === 'true' ? true : req.query.destacado === 'false' ? false : undefined,
      activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined,
      busqueda: req.query.busqueda as string || undefined,
    });
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const meta = buildPaginationMeta(page, limit, result.total);
    sendSuccess(res, result.productos, 'Products retrieved successfully', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = productoIdSchema.parse(req.params);
    const producto = await ProductoService.getProductoById(parseInt(id));
    if (!producto) {
      sendNotFound(res, 'Product not found');
      return;
    }
    sendSuccess(res, producto, 'Product retrieved successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendBadRequest(res, 'Invalid product ID format');
      return;
    }
    next(error);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { slug } = slugSchema.parse(req.params);
    const producto = await ProductoService.getProductoBySlug(slug);
    if (!producto) {
      sendNotFound(res, 'Product not found');
      return;
    }
    sendSuccess(res, producto, 'Product retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createProductoSchema.parse(req.body);

    // Handle image from multer upload
    let imagenUrl: string | undefined;
    if (req.file) {
      // Create URL relative to the server
      imagenUrl = `/uploads/productos/${req.file.filename}`;
    }

    const productoData: any = {
      nombre: data.nombre,
      slug: data.slug,
      descripcion_larga: data.descripcion,
      precio_venta: data.precio,
      stock: data.stock,
      sku: data.sku,
      id_categoria: data.categoriaId || 1, // Fallback if 0/undefined
      activo: data.activo,
      destacado: data.destacado,
      imagenes: imagenUrl ? [{ url: imagenUrl, es_principal: true }] : undefined,
    };

    const producto = await ProductoService.createProducto(productoData);
    sendCreated(res, producto, 'Product created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = productoIdSchema.parse(req.params);
    const data = updateProductoSchema.parse(req.body);

    const productoData: any = {
      nombre: data.nombre,
      slug: data.slug,
      descripcion_larga: data.descripcion,
      precio_venta: data.precio,
      stock: data.stock,
      sku: data.sku,
      id_categoria: data.categoriaId || 1,
      activo: data.activo,
      destacado: data.destacado,
      imagenes: data.imagenUrl ? [{ url: data.imagenUrl, es_principal: true }] : undefined,
    };

    const producto = await ProductoService.updateProducto(parseInt(id), productoData);
    if (!producto) {
      sendNotFound(res, 'Product not found');
      return;
    }
    sendSuccess(res, producto, 'Product updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = productoIdSchema.parse(req.params);
    const deleted = await ProductoService.deleteProducto(parseInt(id));
    if (!deleted) {
      sendNotFound(res, 'Product not found');
      return;
    }
    sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendBadRequest(res, 'Invalid product ID format');
      return;
    }
    next(error);
  }
}

export async function getDestacados(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    const productos = await ProductoService.getProductosDestacados(limit);
    sendSuccess(res, productos, 'Featured products retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, page, limit } = searchQuerySchema.parse(req.query);
    const result = await ProductoService.searchProductos(q, { page, limit });
    const meta = buildPaginationMeta(page, limit, result.total);
    sendSuccess(res, result.productos, 'Search results retrieved', 200, meta);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function getCategorias(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categorias = await ProductoService.getAllCategorias();
    sendSuccess(res, categorias, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMarcas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const marcas = await ProductoService.getAllMarcas();
    sendSuccess(res, marcas, 'Brands retrieved successfully');
  } catch (error) {
    next(error);
  }
}
