/**
 * Middleware de control de acceso basado en roles (RBAC)
 * @module middlewares/rbac.middleware
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Opciones para el middleware de roles
 */
export interface RbacOptions {
  roles: string[];
  requireAllRoles?: boolean;
}

/**
 * Middleware para verificar que el usuario tiene los roles requeridos
 * Soporta múltiples roles con lógica OR (cualquiera de los roles es suficiente)
 * @param roles - Roles requeridos (al menos uno debe tener el usuario)
 * @returns Función de middleware de Express
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        errors: ['Authentication is required to access this resource'],
      });
      return;
    }

    if (!roles || roles.length === 0) {
      next();
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some((requiredRole) => userRoles.includes(requiredRole));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado',
        errors: [
          `Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
          `Roles del usuario: ${userRoles.join(', ') || 'ninguno'}`,
        ],
      });
      return;
    }

    next();
  };
}

/**
 * Middleware para verificar que el usuario tiene TODOS los roles especificados
 * @param roles - Roles requeridos (todos deben estar presentes)
 * @returns Función de middleware de Express
 */
export function requireAllRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        errors: ['Authentication is required to access this resource'],
      });
      return;
    }

    if (!roles || roles.length === 0) {
      next();
      return;
    }

    const userRoles = req.user.roles || [];
    const missingRoles = roles.filter((role) => !userRoles.includes(role));

    if (missingRoles.length > 0) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado',
        errors: [
          `Se requieren todos los siguientes roles: ${roles.join(', ')}`,
          `Roles faltantes: ${missingRoles.join(', ')}`,
        ],
      });
      return;
    }

    next();
  };
}