/**
 * Esquemas de validación Zod para autenticación
 * @module schemas/auth.schema
 */

import { z } from 'zod';

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)/;
const passwordRequirements = 'Al menos 8 caracteres, 1 mayúscula y 1 número';

const emailSchema = z
  .string({
    required_error: 'El correo electrónico es requerido',
    invalid_type_error: 'El correo electrónico debe ser una cadena de texto',
  })
  .email('Formato de correo electrónico inválido')
  .min(1, 'El correo electrónico es requerido');

const passwordSchema = z
  .string({
    required_error: 'La contraseña es requerida',
    invalid_type_error: 'La contraseña debe ser una cadena de texto',
  })
  .min(8, `La contraseña debe tener al menos 8 caracteres (${passwordRequirements})`)
  .regex(passwordRegex, `La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número`);

/**
 * Esquema de registro de usuario
 * Valida: email, password, nombre, apellido, telefono (opcional)
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nombre: z
    .string({
      required_error: 'El nombre es requerido',
      invalid_type_error: 'El nombre debe ser una cadena de texto',
    })
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  apellido: z
    .string({
      required_error: 'El apellido es requerido',
      invalid_type_error: 'El apellido debe ser una cadena de texto',
    })
    .min(1, 'El apellido es requerido')
    .max(100, 'El apellido no puede exceder 100 caracteres'),
  telefono: z
    .string({
      invalid_type_error: 'El teléfono debe ser una cadena de texto',
    })
    .optional()
    .refine(
      (val) => !val || /^[+]?[\d\s-]{8,20}$/.test(val),
      'Formato de teléfono inválido'
    ),
});

/**
 * Esquema de inicio de sesión
 * Valida: email, password
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({
      required_error: 'La contraseña es requerida',
      invalid_type_error: 'La contraseña debe ser una cadena de texto',
    })
    .min(1, 'La contraseña es requerida'),
});

/**
 * Esquema para refrescar token
 * Valida: refreshToken (string no vacío)
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({
      required_error: 'El token de refresco es requerido',
      invalid_type_error: 'El token de refresco debe ser una cadena de texto',
    })
    .min(1, 'El token de refresco es requerido'),
});

/**
 * Esquema para cambiar contraseña
 * Valida: oldPassword, newPassword (mismas reglas que password)
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string({
        required_error: 'La contraseña actual es requerida',
        invalid_type_error: 'La contraseña actual debe ser una cadena de texto',
      })
      .min(1, 'La contraseña actual es requerida'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;