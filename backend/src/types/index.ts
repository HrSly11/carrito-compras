export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: IPaginationMeta;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type UserRole = 'ADMIN' | 'VENDEDOR' | 'GERENTEVENTAS' | 'GERENTEINVENTARIO' | 'CLIENTE';

export interface IAuthUser {
  userId: number;
  email: string;
  nombre: string;
  roles: UserRole[];
}

export interface IJwtPayload {
  userId: number;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
