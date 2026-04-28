/**
 * Middleware de autenticación JWT
 * @module middlewares/auth.middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IJwtPayload, IAuthUser } from '../types/index.js';
import { config } from '../config/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret;

export interface AuthOptions {
  optional?: boolean;
}

/**
 * Middleware para verificar el token JWT del Authorization header
 * Extrae y valida el token Bearer y adjunta el usuario decodificado a req.user
 * @param options - Opciones de autenticación
 * @returns Función de middleware de Express
 */
export function authenticate(options: AuthOptions = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      if (options.optional) {
        return next();
      }
      res.status(401).json({
        success: false,
        message: 'Token de autorización no proporcionado',
        errors: ['Authorization header is required'],
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        message: 'Formato de token inválido',
        errors: ['Authorization header must be: Bearer <token>'],
      });
      return;
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;

      req.user = {
        id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles as UserRole[],
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expirado',
          errors: ['Access token has expired'],
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Token inválido',
          errors: ['Invalid access token'],
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Error de autenticación',
        errors: ['Authentication error'],
      });
    }
  };
}

/**
 * Middleware que requiere autenticación (no opcional)
 */
export const optionalAuth = authenticate({ optional: true });

/**
 * Alias para authenticate sin opciones (autenticación requerida)
 */
export const requireAuth = authenticate();