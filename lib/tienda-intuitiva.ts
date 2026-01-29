/**
 * Backend Intuitivo - Versión Simplificada
 * Uso: const tienda = new Tienda('5112334');
 *      const productos = await tienda.productos.todos();
 */

import { getStoreData, fetchTN } from './backend';
import { processProduct, getRelatedProducts, formatPrice } from './product-utils';

export class Tienda {
  private shopId: string;
  private storeData: any = null;

  constructor(shopId: string = '5112334') {
    this.shopId = shopId;
  }

  /**
   * Inicializar conexión con la tienda
   */
  private async init() {
    if (!this.storeData) {
      this.storeData = await getStoreData(this.shopId);
      if (!this.storeData) {
        throw new Error(`Tienda ${this.shopId} no encontrada`);
      }
    }
    return this.storeData;
  }

  /**
   * Información básica de la tienda
   */
  get info() {
    return {
      obtener: async () => {
        const store = await this.init();
        return {
          id: store.storeId,
          nombre: store.shop_name,
          logo: store.logo,
          dominio: store.domain,
          actualizado: store.updated_at
        };
      }
    };
  }

  /**
   * Manejo de productos
   */
  get productos() {
    return {
      // Obtener todos los productos
      todos: async (filtros: {
        categoria?: string;
        limite?: number;
        orden?: 'precio' | 'nombre' | 'fecha';
        buscar?: string;
      } = {}) => {
        const store = await this.init();
        let query = `limit=${filtros.limite || 50}`;
        
        if (filtros.categoria) query += `&category=${filtros.categoria}`;
        if (filtros.orden) {
          const sortMap = { precio: 'price', nombre: 'name', fecha: 'created_at' };
          query += `&sort_by=${sortMap[filtros.orden]}`;
        }
        if (filtros.buscar) query += `&q=${encodeURIComponent(filtros.buscar)}`;

        const productos = await fetchTN('products', store.storeId, store.accessToken, query);
        return (productos || [])
          .filter((p: any) => p?.published && p?.variants?.length > 0)
          .map((p: any) => this.formatearProducto(p));
      },

      // Obtener un producto específico
      obtener: async (id: string) => {
        const store = await this.init();
        const producto = await fetchTN(`products/${id}`, store.storeId, store.accessToken);
        return producto ? this.formatearProducto(producto) : null;
      },

      // Buscar productos
      buscar: async (termino: string, limite: number = 10) => {
        const store = await this.init();
        const query = `q=${encodeURIComponent(termino)}&limit=${limite}&published=true`;
        const resultados = await fetchTN('products', store.storeId, store.accessToken, query);
        return (resultados || [])
          .filter((p: any) => p?.published && p?.variants?.length > 0)
          .map((p: any) => this.formatearProducto(p));
      },

      // Productos relacionados
      relacionados: async (productoId: string, limite: number = 4) => {
        const [producto, todos] = await Promise.all([
          this.productos.obtener(productoId),
          this.productos.todos({ limite: 50 })
        ]);
        
        if (!producto) return [];
        
        return getRelatedProducts(todos, parseInt(productoId), producto.categoriaId, limite)
          .map((p: any) => this.formatearProducto(p));
      },

      // Crear producto (requiere permisos)
      crear: async (datosProducto: any) => {
        const store = await this.init();
        const res = await fetch(`https://api.tiendanube.com/v1/${store.storeId}/products`, {
          method: 'POST',
          headers: {
            'Authentication': `bearer ${store.accessToken}`,
            'User-Agent': 'Direchentt',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosProducto)
        });
        
        if (!res.ok) throw new Error('Error al crear producto');
        return await res.json();
      }
    };
  }

  /**
   * Manejo de categorías
   */
  get categorias() {
    return {
      // Todas las categorías organizadas
      todas: async () => {
        const store = await this.init();
        const categorias = await fetchTN('categories', store.storeId, store.accessToken);
        
        const principales = (categorias || []).filter((c: any) => !c.parent);
        const subcategorias = (categorias || []).filter((c: any) => c.parent);
        
        return principales.map((principal: any) => ({
          id: principal.id,
          nombre: typeof principal.name === 'object' 
            ? (principal.name.es || principal.name.en || 'Categoría') 
            : principal.name,
          hijos: subcategorias
            .filter((sub: any) => sub.parent === principal.id)
            .map((sub: any) => ({
              id: sub.id,
              nombre: typeof sub.name === 'object' 
                ? (sub.name.es || sub.name.en || 'Subcategoría') 
                : sub.name,
              padre: sub.parent
            }))
        }));
      },

      // Obtener productos de una categoría
      productos: async (categoriaId: string) => {
        return await this.productos.todos({ categoria: categoriaId });
      }
    };
  }

  /**
   * Utilidades de búsqueda
   */
  get buscar() {
    return {
      // Búsqueda simple
      simple: async (termino: string) => {
        return await this.productos.buscar(termino);
      },

      // Búsqueda avanzada
      avanzada: async (opciones: {
        termino?: string;
        categoria?: string;
        precioMin?: number;
        precioMax?: number;
        limite?: number;
      }) => {
        let productos = await this.productos.todos({ 
          categoria: opciones.categoria,
          limite: opciones.limite || 50
        });

        if (opciones.termino) {
          const termino = opciones.termino.toLowerCase();
          productos = productos.filter((p: any) => 
            p.nombre.toLowerCase().includes(termino) ||
            p.descripcion?.toLowerCase().includes(termino)
          );
        }

        if (opciones.precioMin || opciones.precioMax) {
          productos = productos.filter((p: any) => {
            const precio = p.precio;
            if (opciones.precioMin && precio < opciones.precioMin) return false;
            if (opciones.precioMax && precio > opciones.precioMax) return false;
            return true;
          });
        }

        return productos;
      }
    };
  }

  /**
   * Formatear producto para uso más fácil
   */
  private formatearProducto(producto: any) {
    const procesado = processProduct(producto);
    if (!procesado) return null;

    return {
      id: procesado.id,
      nombre: procesado.name,
      descripcion: procesado.description,
      precio: procesado.variants?.[0]?.price || 0,
      precioFormateado: formatPrice(procesado.variants?.[0]?.price || 0),
      imagenes: procesado.images?.map((img: any) => img.src) || [],
      imagenPrincipal: procesado.images?.[0]?.src || null,
      variantes: procesado.variants || [],
      stock: procesado.variants?.reduce((total: number, v: any) => total + (v.stock || 0), 0) || 0,
      tieneStock: procesado.variants?.some((v: any) => v.stock > 0) || false,
      categoriaId: procesado.category_id,
      tags: procesado.tags || [],
      url: `/product/${procesado.id}?shop=${this.shopId}`,
      fechaCreacion: procesado.created_at,
      publicado: procesado.published,
      // Datos originales por si se necesitan
      _original: procesado
    };
  }
}

/**
 * Función helper para crear una tienda rápidamente
 */
export function crearTienda(shopId?: string) {
  return new Tienda(shopId);
}

/**
 * Hook de React para usar la tienda
 */
export function useTienda(shopId?: string) {
  return new Tienda(shopId);
}