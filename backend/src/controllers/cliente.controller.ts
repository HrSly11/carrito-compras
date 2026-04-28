import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendNotFound, buildPaginationMeta } from '../utils/response.util.js';
import { z } from 'zod';

const prisma = new PrismaClient();

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  segmento: z.string().optional(),
  busqueda: z.string().optional(),
});

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('[ClienteController] getAll called, user:', req.user?.roles);
    const validatedQuery = paginationSchema.parse(req.query);
    const { page, limit, segmento, busqueda } = validatedQuery;
    const skip = (page - 1) * limit;

    const userWhere: any = {
      roles: { some: { rol: { nombre: 'Cliente' } } },
    };

    if (segmento && segmento !== 'all') {
      userWhere.cliente = { segmento };
    }

    if (busqueda) {
      userWhere.OR = [
        { email: { contains: busqueda, mode: 'insensitive' } },
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { apellido: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    const [usuarios, total] = await Promise.all([
      prisma.seg_usuarios.findMany({
        where: userWhere,
        skip,
        take: limit,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          created_at: true,
          cliente: {
            select: {
              id: true,
              segmento: true,
              total_gastado: true,
              fecha_ultima_compra: true,
            },
          },
          ordenes: { select: { id: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.seg_usuarios.count({ where: userWhere }),
    ]);

    const clientes = usuarios.map((u) => ({
      id: u.cliente?.id ?? u.id,
      id_usuario: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      telefono: u.telefono,
      segmento: u.cliente?.segmento ?? 'nuevo',
      totalGastado: Number(u.cliente?.total_gastado ?? 0),
      ultimaCompra: u.cliente?.fecha_ultima_compra ?? null,
      fechaRegistro: u.created_at,
      ordenesCount: u.ordenes?.length ?? 0,
    }));

    console.log('[ClienteController] found:', clientes.length, 'total:', total);
    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, clientes, 'Clientes retrieved successfully', 200, meta);
  } catch (error: any) {
    console.error('[ClienteController] error:', error.message || error);
    next(error);
  }
}


export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const cliente = await prisma.cli_clientes.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: { id: true, email: true, estado: true },
        },
        ordenes: {
          take: 10,
          orderBy: { fecha_creacion: 'desc' },
          select: {
            id: true,
            numero_orden: true,
            total: true,
            estado_actual: true,
            fecha_creacion: true,
          },
        },
        direcciones: true,
      },
    });

    if (!cliente) {
      sendNotFound(res, 'Cliente not found');
      return;
    }

    sendSuccess(res, cliente, 'Cliente retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getSegmentos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const segmentos = await prisma.cli_clientes.groupBy({
      by: ['segmento'],
      _count: true,
      where: {
        segmento: { not: null },
      },
    });

    const result = segmentos.map((s) => ({
      segmento: s.segmento || 'Sin segmento',
      cantidad: s._count,
    }));

    sendSuccess(res, result, 'Segmentos retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      sendSuccess(res, [], 'Search query required');
      return;
    }

    const clientes = await prisma.cli_clientes.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { nombre: { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
          { numero_documento: { contains: q, mode: 'insensitive' } },
        ],
        activo: true,
      },
      take: 20,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        segmento: true,
      },
    });

    sendSuccess(res, clientes, 'Search results retrieved');
  } catch (error) {
    next(error);
  }
}