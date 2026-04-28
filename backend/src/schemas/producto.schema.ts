import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(12).optional(),
  sortBy: z.string().default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  categoria: z.string().optional(),
  marca: z.string().optional(),
  minPrecio: z.coerce.number().min(0).optional(),
  maxPrecio: z.coerce.number().min(0).optional(),
  destacado: z.coerce.boolean().optional(),
  activo: z.coerce.boolean().optional(),
  busqueda: z.string().optional(),
});
