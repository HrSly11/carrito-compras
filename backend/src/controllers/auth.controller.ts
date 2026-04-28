import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import AuthService from '../services/auth.service';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
  sendNotFound,
} from '../utils/response.util';

const registerSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  telefono: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);
    sendCreated(res, result, 'User registered successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data.email, data.password);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!req.user) {
      sendUnauthorized(res, 'Not authenticated');
      return;
    }
    await AuthService.logout(req.user.userId, refreshToken);
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      sendBadRequest(res, 'Refresh token required');
      return;
    }
    const result = await AuthService.refreshToken(refreshToken);
    sendSuccess(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Not authenticated');
      return;
    }
    const result = await AuthService.getMe(req.user.id);
    sendSuccess(res, result, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Not authenticated');
      return;
    }
    const data = changePasswordSchema.parse(req.body);
    await AuthService.changePassword(req.user.id, data.currentPassword, data.newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = requestResetSchema.parse(req.body);
    await AuthService.requestPasswordReset(data.email);
    sendSuccess(res, null, 'Password reset email sent');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = resetPasswordSchema.parse(req.body);
    await AuthService.resetPassword(data.token, data.newPassword);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendBadRequest(res, 'Validation failed', message);
      return;
    }
    if (error instanceof Error && error.message === 'Invalid or expired reset token') {
      sendBadRequest(res, error.message);
      return;
    }
    next(error);
  }
}
