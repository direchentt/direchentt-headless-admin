/**
 * Cliente Frontend Súper Intuitivo
 * Uso: const api = new TiendaAPI('5112334');
 *      const productos = await api.productos();
 */

'use client';

export class TiendaAPI {
  private shopId: string;
  private baseUrl: string;

  constructor(shopId: string = '5112334') {
    this.shopId = shopId;
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
  }

  /**
   * Obtener productos con filtros simples
   */
  async productos(filtros: {
    categoria?: string;
    buscar?: string;
    limite?: number;
    orden?: 'precio' | 'nombre' | 'fecha';
  } = {}) {
    const params = new URLSearchParams({ shop: this.shopId });
    
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    if (filtros.limite) params.append('limite', filtros.limite.toString());
    if (filtros.orden) params.append('orden', filtros.orden);

    const response = await fetch(`${this.baseUrl}/api/simple/productos?${params}`);
    const data = await response.json();
    
    if (!data.exito) throw new Error(data.error);
    return data;
  }

  /**
   * Obtener un producto específico
   */
  async producto(id: string) {
    const response = await fetch(`${this.baseUrl}/api/simple/producto/${id}?shop=${this.shopId}`);
    const data = await response.json();
    
    if (!data.exito) throw new Error(data.error);
    return data;
  }

  /**
   * Obtener todas las categorías
   */
  async categorias() {
    const response = await fetch(`${this.baseUrl}/api/simple/categorias?shop=${this.shopId}`);
    const data = await response.json();
    
    if (!data.exito) throw new Error(data.error);
    return data;
  }

  /**
   * Buscar productos
   */
  async buscar(termino: string, opciones: {
    categoria?: string;
    precioMin?: number;
    precioMax?: number;
    limite?: number;
  } = {}) {
    const params = new URLSearchParams({ 
      shop: this.shopId,
      q: termino
    });
    
    if (opciones.categoria) params.append('categoria', opciones.categoria);
    if (opciones.precioMin) params.append('precioMin', opciones.precioMin.toString());
    if (opciones.precioMax) params.append('precioMax', opciones.precioMax.toString());
    if (opciones.limite) params.append('limite', opciones.limite.toString());

    const response = await fetch(`${this.baseUrl}/api/simple/buscar?${params}`);
    const data = await response.json();
    
    if (!data.exito) throw new Error(data.error);
    return data;
  }
}

/**
 * Hooks de React súper simples
 */
import { useState, useEffect } from 'react';

export function useTiendaAPI(shopId?: string) {
  return new TiendaAPI(shopId);
}

export function useProductos(shopId?: string, filtros?: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const api = useTiendaAPI(shopId);

  useEffect(() => {
    api.productos(filtros)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filtros)]);

  return { data, loading, error, productos: data?.productos || [] };
}

export function useProducto(id: string, shopId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const api = useTiendaAPI(shopId);

  useEffect(() => {
    if (!id) return;
    
    api.producto(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { 
    data, 
    loading, 
    error, 
    producto: data?.producto || null,
    relacionados: data?.relacionados || []
  };
}

export function useCategorias(shopId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const api = useTiendaAPI(shopId);

  useEffect(() => {
    api.categorias()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { 
    data, 
    loading, 
    error, 
    categorias: data?.categorias || []
  };
}

export function useBusqueda(termino: string, opciones?: any, shopId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const api = useTiendaAPI(shopId);

  useEffect(() => {
    if (!termino.trim()) return;
    
    setLoading(true);
    setError(null);
    
    api.buscar(termino, opciones)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [termino, JSON.stringify(opciones)]);

  return { 
    data, 
    loading, 
    error, 
    resultados: data?.resultados || []
  };
}