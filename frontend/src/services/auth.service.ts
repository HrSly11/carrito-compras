import api from './api';

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: 'ADMIN' | 'CLIENTE' | 'VENDEDOR' | 'GERENTEVENTAS' | 'GERENTEINVENTARIO';
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: { user: any; tokens: { accessToken: string; refreshToken: string } } }>('/auth/login', { email, password });
    const userData = response.data.data.user;

    const roleMap: Record<string, string> = {
      'Administrador': 'ADMIN',
      'Cliente': 'CLIENTE',
      'GerenteVentas': 'GERENTEVENTAS',
      'GerenteInventario': 'GERENTEINVENTARIO',
      'Vendedor': 'VENDEDOR',
      'Invitado': 'INVITADO',
    };

    let roles: string[] = [];

    if (userData.roles && Array.isArray(userData.roles)) {
      roles = userData.roles.map((r: any) => {
        console.log('[AuthService] Processing role:', r, 'rol name:', r.rol?.nombre)
        const roleName = r.rol?.nombre || r.rolName || '';
        return roleMap[roleName] || roleName;
      }).filter(Boolean);
      console.log('[AuthService] Mapped roles:', roles)
    }

    if (roles.length === 0 && userData.rol) {
      console.log('[AuthService] No roles from array, using rol field:', userData.rol)
      const mappedRole = roleMap[userData.rol] || userData.rol;
      roles = [mappedRole];
    }

    console.log('[AuthService] Final roles:', roles, 'raw userData.roles:', JSON.stringify(userData.roles))

    const rol = roles[0] || 'CLIENTE';

    return {
      user: {
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        telefono: userData.telefono,
        rol: rol as 'ADMIN' | 'CLIENTE',
        roles: roles,
      },
      accessToken: response.data.data.tokens.accessToken,
      refreshToken: response.data.data.tokens.refreshToken,
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    const response = await api.post<TokenRefreshResponse>('/auth/refresh', { refreshToken });
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  }
}

export default new AuthService();