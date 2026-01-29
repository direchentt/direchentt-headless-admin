/**
 * Utilidades para el procesamiento de productos de TiendaNube
 */

/**
 * Procesa un producto individual de TiendaNube para uso en la aplicación
 * @param product Producto raw de TiendaNube
 * @returns Producto procesado y limpio
 */
export function processProduct(product: any) {
  if (!product) return null;

  // Remover datos sensibles del producto
  const cleanProduct = { ...product };
  if (cleanProduct.payment_methods) delete cleanProduct.payment_methods;
  if (cleanProduct.payment_options) delete cleanProduct.payment_options;
  if (cleanProduct.installments) delete cleanProduct.installments;

  return {
    ...cleanProduct,
    // Variantes - procesar cada variante para convertir objetos a strings
    variants: (cleanProduct.variants || []).map((v: any) => ({
      ...v,
      price: typeof v.price === 'number' ? v.price : (typeof v.price === 'string' ? parseFloat(v.price) : v.price?.es || v.price?.en || 0),
      description: typeof v.description === 'object' ? (v.description.es || v.description.en || '') : (v.description || ''),
    })),
    // Imágenes
    images: cleanProduct.images || [],
    // Información básica
    name: typeof cleanProduct.name === 'object' ? cleanProduct.name.es || cleanProduct.name.en : cleanProduct.name,
    description: typeof cleanProduct.description === 'object' ? (cleanProduct.description.es || cleanProduct.description.en) : cleanProduct.description,
    // Stock y precio
    stock: cleanProduct.stock || 0,
    basePrice: cleanProduct.variants?.[0]?.price || 0,
    // SEO
    seoTitle: typeof cleanProduct.seo_title === 'object' ? (cleanProduct.seo_title.es || cleanProduct.seo_title.en) : cleanProduct.seo_title || cleanProduct.name,
    seoDescription: typeof cleanProduct.seo_description === 'object' ? (cleanProduct.seo_description.es || cleanProduct.seo_description.en) : cleanProduct.seo_description || '',
    // Categorías del producto
    productCategories: (cleanProduct.category_id ? [cleanProduct.category_id] : []),
    // Atributos
    attributes: cleanProduct.attributes || {},
    // Timestamps
    createdAt: cleanProduct.created_at,
    updatedAt: cleanProduct.updated_at,
    // Tags - asegurar que sea array y convertir objetos a strings
    tags: (Array.isArray(cleanProduct.tags) ? cleanProduct.tags : (cleanProduct.tags ? [cleanProduct.tags] : []))
      .map((tag: any) => typeof tag === 'object' ? (tag.es || tag.en || '') : String(tag))
      .filter(Boolean),
    // Peso y dimensiones
    weight: cleanProduct.weight,
    height: cleanProduct.height,
    width: cleanProduct.width,
    depth: cleanProduct.depth,
    // Publicado
    published: cleanProduct.published || false,
  };
}

/**
 * Obtiene productos relacionados basados en la categoría del producto actual
 * @param products Lista de productos
 * @param currentProductId ID del producto actual
 * @param categoryId ID de la categoría del producto actual
 * @param limit Límite de productos relacionados a retornar
 * @returns Array de productos relacionados
 */
export function getRelatedProducts(products: any[], currentProductId: number, categoryId: number, limit: number = 4) {
  // Obtener productos relacionados (misma categoría, excluyendo el actual)
  let relatedProducts = (products || [])
    .filter((p: any) => p.id !== currentProductId && p.category_id === categoryId)
    .slice(0, limit);
  
  // Si no hay productos en la misma categoría, obtener otros publicados
  if (relatedProducts.length < limit) {
    relatedProducts = (products || [])
      .filter((p: any) => p.id !== currentProductId)
      .slice(0, limit);
  }

  return relatedProducts;
}

/**
 * Convierte texto multiidioma a string simple
 * @param text Texto que puede ser string u objeto multiidioma
 * @param defaultText Texto por defecto si no se encuentra
 * @returns String simple
 */
export function getLocalizedText(text: any, defaultText: string = ''): string {
  if (typeof text === 'string') return text;
  if (typeof text === 'object' && text !== null) {
    return text.es || text.en || defaultText;
  }
  return defaultText;
}

/**
 * Formatea precio para mostrar
 * @param price Precio en número o string
 * @param currency Moneda (por defecto ARS)
 * @returns Precio formateado
 */
export function formatPrice(price: any, currency: string = 'ARS'): string {
  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
}

/**
 * Verifica si un producto tiene stock disponible
 * @param product Producto a verificar
 * @returns true si tiene stock disponible
 */
export function hasStock(product: any): boolean {
  if (!product?.variants?.length) return false;
  return product.variants.some((variant: any) => variant.stock > 0);
}

/**
 * Obtiene la imagen principal de un producto
 * @param product Producto
 * @returns URL de la imagen principal o null
 */
export function getMainImage(product: any): string | null {
  if (!product?.images?.length) return null;
  return product.images[0]?.src || null;
}