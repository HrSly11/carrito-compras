import api from './api';

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagen?: string | null;
  activo: boolean;
}

export interface Marca {
  id: number;
  nombre: string;
  slug: string;
  logo?: string;
  activo: boolean;
}

class CategoriaService {
  async getCategorias(): Promise<Categoria[]> {
    const response = await api.get<{ success: boolean; data: Categoria[] }>('/productos/categorias');
    return response.data.data;
  }

  async getMarcas(): Promise<Marca[]> {
    const response = await api.get<{ success: boolean; data: Marca[] }>('/productos/marcas');
    return response.data.data;
  }
}

export default new CategoriaService();