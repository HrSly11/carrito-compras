import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, seg_usuarios, seg_usuario_rol } from '@prisma/client';
import { config } from '../config';
import { UserRole, IJwtPayload } from '../types/index.js';

const prisma = new PrismaClient();

/**
 * Interfaz para el payload del JWT
 */
export interface IJwtPayload {
  userId: number;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Interfaz para el par de tokens
 */
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Interfaz para datos de login
 */
export interface ILoginData {
  email: string;
  password: string;
}

/**
 * Interfaz para datos de registro
 */
export interface IRegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

/**
 * Servicio de autenticación que maneja todas las operaciones relacionadas
 * con usuarios, tokens JWT, hashing de contraseñas y recuperación de cuentas.
 */
export class AuthService {
  /**
   * Genera un hash bcrypt de la contraseña proporcionada
   * @param password - Contraseña en texto plano
   * @returns Promise con el hash bcrypt de 12 rondas
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcrypt.saltRounds);
  }

  /**
   * Compara una contraseña en texto plano con un hash bcrypt
   * @param password - Contraseña en texto plano
   * @param hash - Hash bcrypt a comparar
   * @returns Promise con true si las contraseñas coinciden
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Genera un token de acceso JWT con información del usuario
   * @param user - Usuario para el cual generar el token
   * @returns Token JWT signed con userId, email y roles
   */
  generateAccessToken(user: seg_usuarios & { roles: seg_usuario_rol[] }): string {
    const roleMap: Record<string, string> = {
      'Administrador': 'ADMIN',
      'Cliente': 'CLIENTE',
      'GerenteVentas': 'GERENTEVENTAS',
      'GerenteInventario': 'GERENTEINVENTARIO',
      'Vendedor': 'VENDEDOR',
      'Invitado': 'INVITADO',
    };

    const roles = (user.roles?.map((r) => roleMap[r.rol?.nombre || ''] || r.rol?.nombre || '') || []).filter(Boolean);

    const payload: Omit<IJwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      roles: roles as UserRole[],
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessTokenExpiry,
    });
  }

  /**
   * Genera un token de refresco JWT con información básica del usuario
   * @param user - Usuario para el cual generar el token
   * @returns Token JWT signed con userId
   */
  generateRefreshToken(user: seg_usuarios): string {
    const payload = {
      userId: user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    });
  }

  /**
   * Genera un par completo de tokens (acceso y refresco)
   * @param user - Usuario para el cual generar los tokens
   * @returns Objeto con accessToken y refreshToken
   */
  generateTokenPair(user: seg_usuarios & { roles: seg_usuario_rol[] }): ITokenPair {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  /**
   * Verifica y decodifica un token de acceso
   * @param token - Token JWT a verificar
   * @returns Payload decodificado del token
   * @throws Error si el token es inválido o ha expirado
   */
  verifyAccessToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as IJwtPayload;
    } catch (error) {
      throw new Error('Token de acceso inválido o expirado');
    }
  }

  /**
   * Verifica y decodifica un token de refresco
   * @param token - Token JWT a verificar
   * @returns Payload decodificado del token
   * @throws Error si el token es inválido o ha expirado
   */
  verifyRefreshToken(token: string): IJwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as IJwtPayload;
      if ((decoded as any).type !== 'refresh') {
        throw new Error('Token no es de tipo refresh');
      }
      return decoded;
    } catch (error) {
      throw new Error('Token de refresco inválido o expirado');
    }
  }

  /**
   * Autentica un usuario con email y contraseña
   * @param email - Correo electrónico del usuario
   * @param password - Contraseña en texto plano
   * @returns Promise con el usuario y el par de tokens
   * @throws Error si las credenciales son inválidas
   */
  async login(email: string, password: string): Promise<{ user: any; tokens: ITokenPair }> {
    const user = await prisma.seg_usuarios.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (user.estado === 'bloqueado') {
      if (user.bloqueado_hasta && user.bloqueado_hasta > new Date()) {
        throw new Error(`Usuario bloqueado hasta ${user.bloqueado_hasta.toISOString()}`);
      }
      await prisma.seg_usuarios.update({
        where: { id: user.id },
        data: { estado: 'activo', bloqueado_hasta: null, intentos_login: 0 },
      });
    }

    const isPasswordValid = await this.comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      const intentos = user.intentos_login + 1;
      const updateData: any = { intentos_login: intentos };

      if (intentos >= 5) {
        updateData.estado = 'bloqueado';
        updateData.bloqueado_hasta = new Date(Date.now() + 30 * 60 * 1000);
      }

      await prisma.seg_usuarios.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new Error('Credenciales inválidas');
    }

    await prisma.seg_usuarios.update({
      where: { id: user.id },
      data: {
        intentos_login: 0,
        last_login: new Date(),
        estado: 'activo',
      },
    });

    const tokens = this.generateTokenPair(user);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @param data - Datos del usuario a registrar
   * @returns Promise con el usuario creado y el par de tokens
   */
  async register(data: IRegisterData): Promise<{ user: any; tokens: ITokenPair }> {
    const existingUser = await prisma.seg_usuarios.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const passwordHash = await this.hashPassword(data.password);

    const user = await prisma.seg_usuarios.create({
      data: {
        email: data.email,
        password_hash: passwordHash,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        estado: 'activo',
        email_verificado: false,
        roles: {
          create: {
            rol: {
              connect: { nombre: 'cliente' },
            },
          },
        },
      },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    const tokens = this.generateTokenPair(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Genera nuevos tokens a partir de un token de refresco
   * @param refreshToken - Token de refresco válido
   * @returns Promise con los nuevos tokens
   * @throws Error si el token es inválido o ha sido revocado
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = this.verifyRefreshToken(refreshToken);

    const storedToken = await prisma.seg_refresh_tokens.findUnique({
      where: { token: refreshToken },
      include: {
        usuario: {
          include: {
            roles: {
              include: {
                rol: true,
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.revoked) {
      throw new Error('Token de refresco inválido o revocado');
    }

    if (storedToken.expira < new Date()) {
      throw new Error('Token de refresco expirado');
    }

    await prisma.seg_refresh_tokens.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const tokens = this.generateTokenPair(storedToken.usuario);
    await this.saveRefreshToken(decoded.userId, tokens.refreshToken);

    return tokens;
  }

  /**
   * Cierra la sesión del usuario revocando el token de refresco
   * @param userId - ID del usuario
   * @param refreshToken - Token de refresco a revocar
   */
  async logout(userId: number, refreshToken: string): Promise<void> {
    await prisma.seg_refresh_tokens.updateMany({
      where: {
        id_usuario: userId,
        token: refreshToken,
        revoked: false,
      },
      data: { revoked: true },
    });
  }

  /**
   * Obtiene un usuario por su ID
   * @param userId - ID del usuario
   * @returns Promise con los datos del usuario sin password_hash
   */
  async getUserById(userId: number): Promise<any> {
    const user = await prisma.seg_usuarios.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
        cliente: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Solicita un reinicio de contraseña para el email proporcionado
   * @param email - Email del usuario
   * Genera un token de recuperación y lo almacena en la base de datos
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.seg_usuarios.findUnique({
      where: { email },
    });

    if (!user) {
      return;
    }

    const token = jwt.sign(
      { userId: user.id, type: 'recovery' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    await prisma.seg_usuarios.update({
      where: { id: user.id },
      data: {
        token_recovery: token,
        fecha_token_recovery: new Date(),
      },
    });
  }

  /**
   * Restablece la contraseña usando un token de recuperación
   * @param token - Token de recuperación
   * @param newPassword - Nueva contraseña
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as IJwtPayload & { type: string };

      if (decoded.type !== 'recovery') {
        throw new Error('Token de recuperación inválido');
      }

      const user = await prisma.seg_usuarios.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.token_recovery !== token) {
        throw new Error('Token de recuperación inválido');
      }

      if (user.fecha_token_recovery && user.fecha_token_recovery < new Date(Date.now() - 60 * 60 * 1000)) {
        throw new Error('El token de recuperación ha expirado');
      }

      const passwordHash = await this.hashPassword(newPassword);

      await prisma.seg_usuarios.update({
        where: { id: user.id },
        data: {
          password_hash: passwordHash,
          token_recovery: null,
          fecha_token_recovery: null,
        },
      });

      await prisma.seg_refresh_tokens.updateMany({
        where: { id_usuario: user.id },
        data: { revoked: true },
      });
    } catch (error) {
      throw new Error('Token de recuperación inválido o expirado');
    }
  }

  /**
   * Guarda un token de refresco en la base de datos
   * @param userId - ID del usuario
   * @param token - Token de refresco
   */
  private async saveRefreshToken(userId: number, token: string): Promise<void> {
    const expira = new Date(Date.now() + config.jwt.refreshTokenExpiryMs);

    await prisma.seg_refresh_tokens.create({
      data: {
        id_usuario: userId,
        token,
        expira,
      },
    });
  }
}

export default new AuthService();
