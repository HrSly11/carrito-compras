/**
 * Manejador global de errores
 * @module middlewares/errorHandler
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

/**
 * Error personalizado de la aplicación
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: string[];

  constructor(message: string, statusCode: number = 500, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Formatea los errores de Zod en un array de strings legibles
 * @param issues - Issues de Zod
 * @returns Array de mensajes de error formateados
 */
function formatZodErrors(issues: ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.join('.');
    const message = issue.message;
    return path ? `${path}: ${message}` : message;
  });
}

/**
 * Maneja errores específicos de Prisma y los convierte a mensajes legibles
 * @param error - Error de Prisma
 * @returns Mensaje de error formateado
 */
function handlePrismaError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          message: 'Ya existe un registro con estos datos únicos',
          statusCode: 409,
        };
      case 'P2025':
        return {
          message: 'Recurso no encontrado',
          statusCode: 404,
        };
      case 'P2003':
        return {
          message: 'Referencia a registro inexistente',
          statusCode: 400,
        };
      default:
        return {
          message: 'Error de base de datos',
          statusCode: 400,
        };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: 'Datos de entrada inválidos',
      statusCode: 400,
    };
  }

  return {
    message: 'Error interno del servidor',
    statusCode: 500,
  };
}

/**
 * Middleware manejador de errores global
 * Procesa diferentes tipos de errores y retorna respuestas JSON consistentes
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Error interno del servidor';
  const errors = err instanceof AppError ? err.errors : undefined;

  logger.error('Error capturado', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: formatZodErrors(err.issues),
    });
    return;
  }

  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
      errors: ['Invalid or malformed token'],
    });
    return;
  }

  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: 'Token expirado',
      errors: ['Access token has expired'],
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError || err instanceof Prisma.PrismaClientValidationError) {
    const { message: prismaMessage, statusCode: prismaStatus } = handlePrismaError(err);
    res.status(prismaStatus).json({
      success: false,
      message: prismaMessage,
      errors: errors || [err.message],
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors || (process.env.NODE_ENV === 'development' ? [err.message] : undefined),
  });
}

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export function notFound(req: Request, res: Response): void {
  logger.warn('Ruta no encontrada', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    errors: [`Cannot ${req.method} ${req.path}`],
  });
}