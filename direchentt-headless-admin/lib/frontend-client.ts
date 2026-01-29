// Utilidades para consumir tu backend desde el frontend
'use client';

const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://tu-dominio.com';

/**
 * Cliente para consumir las APIs del backend
 */
export class BackendClient {
  private shopId: string;

  constructor(shopId: string = '5112334') {
    this.shopId = shopId;
  }

  /**
   * Obtener productos
   */
  async getProducts(options: {
    category?: string;
    limit?: number;
    sort?: string;
  } = {}) {
    const params = new URLSearchParams({
      shop: this.shopId,
      ...Object.fromEntries(
        Object.entries(options).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )
    });

    const response = await fetch(`${API_BASE}/api/products?${params}`);
    return await response.json();
  }

  /**
   * Obtener producto individual
   */
  async getProduct(productId: string) {
    const response = await fetch(`${API_BASE}/api/products/${productId}?shop=${this.shopId}`);
    return await response.json();
  }

  /**
   * Obtener categorías
   */
  async getCategories() {
    const response = await fetch(`${API_BASE}/api/categories?shop=${this.shopId}`);
    return await response.json();
  }

  /**
   * Obtener información de la tienda
   */
  async getStore() {
    const response = await fetch(`${API_BASE}/api/store?shop=${this.shopId}`);
    return await response.json();
  }

  /**
   * Buscar productos
   */
  async searchProducts(query: string, limit: number = 10) {
    const params = new URLSearchParams({
      shop: this.shopId,
      q: query,
      limit: String(limit)
    });

    const response = await fetch(`${API_BASE}/api/search?${params}`);
    return await response.json();
  }

  /**
   * Crear producto (requiere permisos)
   */
  async createProduct(productData: any) {
    const response = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shopId: this.shopId,
        productData
      })
    });

    return await response.json();
  }
}

// Hook personalizado para React
import { useState, useEffect } from 'react';

export function useBackend(shopId?: string) {
  const [client] = useState(() => new BackendClient(shopId));
  return client;
}

export function useProducts(shopId?: string, options?: any) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const client = useBackend(shopId);

  useEffect(() => {
    client.getProducts(options)
      .then(data => {
        if (data.success) {
          setProducts(data.products);
        } else {
          setError(data.error);
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [client, JSON.stringify(options)]);

  return { products, loading, error };
}

export function useProduct(productId: string, shopId?: string) {
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const client = useBackend(shopId);

  useEffect(() => {
    if (!productId) return;
    
    client.getProduct(productId)
      .then(data => {
        if (data.success) {
          setProduct(data.product);
          setRelated(data.related || []);
        } else {
          setError(data.error);
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [client, productId]);

  return { product, related, loading, error };
}