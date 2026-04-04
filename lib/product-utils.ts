/**
 * Utilidades para el procesamiento de productos de TiendaNube
 */

/** URL principal de imagen (API Tiendanube suele usar `src`; otros formatos traen `url`). */
export function getProductPrimaryImageUrl(product: any): string {
  const img = product?.images?.[0];
  if (!img || typeof img !== 'object') return '';
  const u = (img as { src?: string; url?: string; secure_url?: string }).src ??
    (img as { url?: string }).url ??
    (img as { secure_url?: string }).secure_url;
  return typeof u === 'string' && u.trim() ? u.trim() : '';
}

export function parseMoney(value: any): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'object' && value !== null) {
    const n = parseFloat(String((value as any).es ?? (value as any).en ?? ''));
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Procesa un producto individual de TiendaNube para uso en la aplicación
 * @param product Producto raw de TiendaNube
 * @returns Producto procesado y limpio
 */
/**
 * Texto opcional para ficha: metafields de producto (API Tiendanube).
 * @see https://tiendanube.github.io/api-documentation/resources/metafields
 */
export function modelNoteFromMetafields(metafields: any[] | null | undefined): string | null {
  if (!Array.isArray(metafields)) return null;
  const want = ['modelo', 'model', 'medidas', 'talle_modelo', 'model_wearing', 'fit'];
  for (const m of metafields) {
    const k = String(m?.key ?? '').toLowerCase();
    if (want.some((w) => k.includes(w))) {
      const v = m?.value;
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
  }
  return null;
}

/** Comentario oculto en el HTML de la descripción: <!-- PDP_MODEL:El modelo mide 1,85 m y usa talle 40 --> */
export function extractModelNoteFromDescription(product: any): string | null {
  const raw =
    typeof product?.description === 'object' && product.description !== null
      ? String(product.description.es || product.description.en || '')
      : String(product?.description || '');
  if (!raw) return null;
  const m = raw.match(/<!--\s*PDP_MODEL:\s*([\s\S]*?)-->/i);
  return m ? m[1].trim() : null;
}

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
      promotional_price:
        v.promotional_price != null && v.promotional_price !== ''
          ? parseMoney(v.promotional_price)
          : null,
      compare_at_price:
        v.compare_at_price != null && v.compare_at_price !== ''
          ? parseMoney(v.compare_at_price)
          : null,
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
    /** Medidas / talle del modelo (descripción o metafields en page) */
    modelWearingNote: extractModelNoteFromDescription(cleanProduct),
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
/**
 * Mezcla un array aleatoriamente (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function getRelatedProducts(products: any[], currentProductId: number, categoryId: number, limit: number = 12) {
  // Filtrar productos válidos (misma categoría o no, excluyendo actual)
  let candidates = (products || []).filter((p: any) => p.id !== currentProductId);

  // Priorizar misma categoría
  const sameCategory = candidates.filter((p: any) => p.category_id === categoryId);
  const others = candidates.filter((p: any) => p.category_id !== categoryId);

  // Mezclar ambos grupos
  const shuffledSame = shuffleArray(sameCategory);
  const shuffledOthers = shuffleArray(others);

  // Combinar: primero misma categoría, luego el resto
  const final = [...shuffledSame, ...shuffledOthers].slice(0, limit);

  return final;
}

/**
 * Obtiene productos de categorías "opuestas" o diferentes para cross-selling
 * @param products Lista completa de productos
 * @param currentCategoryId ID de la categoría actual
 * @param limit Límite por grupo
 */
export function getCrossSellProducts(products: any[], currentCategoryId: number, limit: number = 12) {
  // Filtrar productos que NO son de la categoría actual
  const otherProducts = products.filter((p: any) => p.category_id && p.category_id !== currentCategoryId);

  // Agrupar por categoría
  const categoryGroups: { [key: number]: any[] } = {};
  otherProducts.forEach(p => {
    const catId = p.category_id;
    if (!categoryGroups[catId]) {
      categoryGroups[catId] = [];
    }
    categoryGroups[catId].push(p);
  });

  // Obtener IDs de categorías disponibles
  const availableCategories = Object.keys(categoryGroups);

  // Mezclar categorías al azar
  const shuffledCategories = shuffleArray(availableCategories);

  // Tomar hasta 2 categorías diferentes
  const selectedCategories = shuffledCategories.slice(0, 2);

  // Retornar categorías con sus productos mezclados
  return selectedCategories.map(catId => ({
    categoryId: catId,
    products: shuffleArray(categoryGroups[parseInt(catId)]).slice(0, limit)
  }));
}

/**
 * Obtiene productos simulados como "Más Vendidos"
 * @param products Lista completa de productos
 * @param limit Límite de productos
 */
export function getBestSellers(products: any[], limit: number = 12) {
  // Simplemente mezclamos y devolvemos
  return shuffleArray(products || []).slice(0, limit);
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
 * Etiquetas del producto en API Tiendanube (`tags`). Uso típico: lógica interna
 * (búsqueda, segmentación); no usar como cucardas en vitrina salvo que definas
 * una lista explícita de etiquetas “públicas”.
 * @see https://tiendanube.github.io/api-documentation/resources/product
 */
export function getProductTagsArray(product: any): string[] {
  if (!product?.tags) return [];
  const raw = product.tags;
  if (Array.isArray(raw)) {
    return raw
      .map((t: any) => (typeof t === 'object' && t !== null ? String(t.es || t.en || '') : String(t)))
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Precio de lista (tachado) y precio actual según API: `price` + `promotional_price`.
 * @see https://tiendanube.github.io/api-documentation/resources/product-variant
 */
export function getVariantDisplayPrices(variant: any): {
  list: number;
  current: number;
  hasPromo: boolean;
} {
  const list = Math.round(parseMoney(variant?.price));
  const promoRaw = variant?.promotional_price;
  const promo =
    promoRaw != null && String(promoRaw).trim() !== '' && String(promoRaw).toLowerCase() !== 'null'
      ? Math.round(parseMoney(promoRaw))
      : null;
  const hasPromo = promo != null && promo > 0 && promo < list;
  let displayList = list;
  let current = list;

  if (hasPromo) {
    current = promo!;
  }

  const compareAt = variant?.compare_at_price;
  if (!hasPromo && compareAt != null && String(compareAt).trim() !== '') {
    const c = Math.round(parseMoney(compareAt));
    if (c > list) {
      displayList = c;
      current = list;
      return { list: displayList, current, hasPromo: true };
    }
  }

  return { list: displayList, current, hasPromo };
}

/**
 * Formatea precio siempre redondeado a entero (sin centavos visibles).
 * @param price Precio en número o string
 * @param currency Moneda (por defecto ARS)
 * @returns Precio formateado
 */
export function formatPrice(price: any, currency: string = 'ARS'): string {
  const rounded = Math.round(parseMoney(price));
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
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