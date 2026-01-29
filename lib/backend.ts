import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Extensiones de imagen soportadas para banners locales
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

// Singleton para la conexión a MongoDB
const uri = process.env.MONGODB_URI || "";
let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) return cachedClient;
  if (!uri) throw new Error("MONGODB_URI no definida");
  
  cachedClient = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });
  await cachedClient.connect();
  return cachedClient;
}

/**
 * Obtiene datos de la tienda desde MongoDB
 * @param shopId ID de la tienda
 * @returns Datos de la tienda o null si no existe
 */
export async function getStoreData(shopId: string) {
  try {
    console.log(`🔍 Buscando tienda ${shopId} en MongoDB...`);
    const client = await getMongoClient();
    const store = await client.db('AppRegaloDB').collection('stores').findOne({ storeId: shopId });
    if (!store) {
      console.warn(`⚠️ No se encontró la tienda ${shopId} en la base de datos.`);
    } else {
      console.log(`✅ Tienda ${shopId} encontrada.`);
    }
    return store;
  } catch (error: any) {
    console.error("❌ Error conectando a MongoDB:", error.message);
    return null;
  }
}

// Cache simple en memoria para desarrollo
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

/**
 * Realiza peticiones a la API de TiendaNube con paginación optimizada
 * @param endpoint Endpoint de la API (ej: 'products', 'categories')
 * @param shopId ID de la tienda
 * @param token Token de acceso Bearer
 * @param query Parámetros de consulta adicionales
 * @returns Datos de la API o array vacío en caso de error
 */
export async function fetchTN(endpoint: string, shopId: string, token: string, query: string = "") {
  const cacheKey = `${shopId}-${endpoint}-${query}`;
  const now = Date.now();
  
  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const queryPrefix = query ? (query.startsWith('&') ? query : `&${query}`) : '';
  const perPage = endpoint === 'products' ? 200 : 200; // Aumentado a 200 para traer más productos
  
  // Timeout de 10 segundos para peticiones a la API (aumentado)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`https://api.tiendanube.com/v1/${shopId}/${endpoint}?per_page=${perPage}${queryPrefix}`, {
      headers: { 
        'Authentication': `bearer ${token}`, 
        'User-Agent': 'Direchentt' 
      },
      signal: controller.signal,
      next: { revalidate: 60 }
    });
    
    clearTimeout(timeoutId);
    const data = res.ok ? await res.json() : [];
    apiCache.set(cacheKey, { data, timestamp: now });
    
    console.log(`📦 Traídos ${data.length} ${endpoint} de TiendaNube`);
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn(`⏳ Timeout en fetchTN (${endpoint}) - Saltando...`);
    } else {
      console.error(`❌ Error en fetchTN (${endpoint}):`, error.message);
    }
    return [];
  }
}

/**
 * Obtiene un producto específico con todas sus variantes y atributos expandidos
 * @param productId ID del producto
 * @param shopId ID de la tienda
 * @param token Token de acceso Bearer
 * @returns Producto con variantes completas o null en caso de error
 */
export async function fetchProductWithVariants(productId: string, shopId: string, token: string) {
  const cacheKey = `${shopId}-product-${productId}-expanded`;
  const now = Date.now();
  
  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // Intentar con expand=variants primero
    let res = await fetch(`https://api.tiendanube.com/v1/${shopId}/products/${productId}?expand=variants`, {
      headers: { 
        'Authentication': `bearer ${token}`, 
        'User-Agent': 'Direchentt' 
      },
      signal: controller.signal,
      next: { revalidate: 60 }
    });
    
    // Si falla, intentar sin expand
    if (!res.ok) {
      res = await fetch(`https://api.tiendanube.com/v1/${shopId}/products/${productId}`, {
        headers: { 
          'Authentication': `bearer ${token}`, 
          'User-Agent': 'Direchentt' 
        },
        signal: controller.signal,
        next: { revalidate: 60 }
      });
    }
    
    clearTimeout(timeoutId);
    const product = res.ok ? await res.json() : null;
    
    if (product) {
      // Log para debug
      console.log(`📦 Producto ${productId} obtenido para QuickShop:`, {
        id: product.id,
        variants_count: product.variants?.length,
        first_variant: product.variants?.[0],
        variant_attributes: product.variants?.[0]?.attributes
      });
      
      apiCache.set(cacheKey, { data: product, timestamp: now });
    }
    
    return product;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn(`⏳ Timeout obteniendo producto ${productId} expandido`);
    } else {
      console.error(`❌ Error obteniendo producto ${productId} expandido:`, error.message);
    }
    return null;
  }
}

/**
 * Extrae el nombre de una categoría de TiendaNube
 * Los nombres pueden ser string o objeto {es: "...", en: "..."}
 */
function extractCategoryName(name: any): string {
  if (!name) return 'Categoría';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') {
    return String(name.es || name.en || Object.values(name)[0] || 'Categoría');
  }
  return 'Categoría';
}

/**
 * Procesa las categorías para el Header
 * @param categories Categorías raw de TiendaNube
 * @returns Categorías procesadas con nombres normalizados
 */
export function processCategories(categories: any[]) {
  return (categories || []).map((cat: any) => ({
    ...cat,
    name: extractCategoryName(cat.name),
    description: typeof cat.description === 'object' 
      ? (cat.description?.es || cat.description?.en || '') 
      : (cat.description || '')
  }));
}

/**
 * Procesa productos para mostrar solo los publicados con variantes
 * @param products Productos raw de TiendaNube
 * @returns Productos filtrados y procesados, ordenados de más nuevo a más viejo
 */
export function processProducts(products: any[]) {
  return (products || [])
    .filter((p: any) => p?.published && p?.variants?.length > 0)
    .sort((a: any, b: any) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Más nuevo primero
    });
}

/**
 * Lee banners locales de la carpeta public/banners
 * @returns Array de URLs de banners locales mezclados aleatoriamente
 */
export function getLocalBanners(): string[] {
  try {
    const bannersDir = path.join(process.cwd(), 'public', 'banners');
    
    // Verificar si la carpeta existe
    if (!fs.existsSync(bannersDir)) {
      console.log('📁 Carpeta de banners no existe, usando banners por defecto');
      return [];
    }
    
    // Leer archivos de la carpeta
    const files = fs.readdirSync(bannersDir);
    
    // Filtrar solo imágenes
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
    });
    
    if (imageFiles.length === 0) {
      console.log('📁 No hay imágenes en la carpeta de banners');
      return [];
    }
    
    // Convertir a rutas públicas
    const bannerUrls = imageFiles.map(file => `/banners/${file}`);
    
    // Mezclar aleatoriamente (Fisher-Yates shuffle)
    for (let i = bannerUrls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bannerUrls[i], bannerUrls[j]] = [bannerUrls[j], bannerUrls[i]];
    }
    
    console.log(`🖼️ ${bannerUrls.length} banners locales cargados`);
    return bannerUrls;
  } catch (error: any) {
    console.error('❌ Error leyendo banners locales:', error.message);
    return [];
  }
}

/**
 * Obtiene banners organizados por tamaño y uso
 * @returns Objeto con banners categorizados por tamaño
 */
export function getOrganizedBanners() {
  return {
    // Banners principales (anchos, para hero slider principal)
    hero: [
      "https://nude-project.com/cdn/shop/files/BODY_WOMAN_HORIZONTAL.png?v=1769082378&width=2265", // 2265px - Extra ancho
      "https://nude-project.com/cdn/shop/files/09_80660996-8462-4430-b277-3ebb435fa868.jpg?v=1768554468&width=1208", // 1208px - Ancho
      "https://nude-project.com/cdn/shop/files/121212tttttt.jpg?v=1766510177&width=800", // 800px - Mediano
      "https://nude-project.com/cdn/shop/files/90909090.jpg?v=1765554876&width=800" // 800px - Mediano
    ],
    
    // Banners verticales (para sidebars o secciones verticales)
    vertical: [
      "https://nude-project.com/cdn/shop/files/BODY_WOMAN_VERTICAL.png?v=1769082378&width=2265", // 2265px - Extra alto
      "https://nude-project.com/cdn/shop/files/VERTICAL_HOME_DEFFFF.png?v=1769169612&width=906", // 906px - Alto
      "https://nude-project.com/cdn/shop/files/VERTICAL_KNIT_MAN.png?v=1769082378&width=906", // 906px - Alto
      "https://nude-project.com/cdn/shop/files/home_vertical_2.webp?v=1768492122&width=600" // 600px - Mediano vertical
    ],
    
    // Banners cuadrados/medianos (para grids o cards)
    medium: [
      "https://nude-project.com/cdn/shop/files/big_in_japa_unisex.png?v=1766505176&width=600", // 600px - Cuadrado
      "https://d3k81ch9hvuctc.cloudfront.net/company/WPfH8e/images/0149518c-0d33-4f2f-b524-542636fc9d2c.jpeg" // Sin especificar - Flexible
    ]
  };
}

/**
 * Obtiene banners por defecto (compatibilidad)
 * @returns Array de URLs de banners por defecto
 */
export function getDefaultBanners() {
  const organized = getOrganizedBanners();
  return [...organized.hero, ...organized.vertical, ...organized.medium];
}

/**
 * Procesa banners: primero busca locales, luego TiendaNube, y finalmente los organizados por defecto
 * @param banners Banners de TiendaNube
 * @param type Tipo de banners: 'hero', 'vertical', 'medium' o 'all'
 * @returns Array de URLs de banners procesados según tipo
 */
export function processBanners(banners: any[], type: 'hero' | 'vertical' | 'medium' | 'all' = 'all') {
  // 1. Primero intentar con banners locales (carpeta public/banners)
  const localBanners = getLocalBanners();
  if (localBanners.length > 0) {
    return localBanners;
  }
  
  // 2. Luego intentar con banners de TiendaNube
  const bannerImages = (banners || [])
    .filter((b: any) => b?.image?.src)
    .map((b: any) => b.image.src)
    .slice(0, 10);
    
  if (bannerImages.length > 0) {
    return bannerImages;
  }

  // 3. Finalmente usar los banners por defecto organizados
  const organized = getOrganizedBanners();
  
  switch (type) {
    case 'hero':
      return organized.hero;
    case 'vertical':
      return organized.vertical;
    case 'medium':
      return organized.medium;
    default:
      return [...organized.hero, ...organized.vertical, ...organized.medium];
  }
}

/**
 * Interfaz para las props del Header
 */
export interface HeaderProps {
  logo?: string;
  storeId: string;
  domain: string;
  categories: any[];
}

/**
 * Interfaz para datos de la tienda desde MongoDB
 */
export interface StoreData {
  storeId: string;
  accessToken: string;
  logo?: string;
  domain: string;
  name?: string;
  shop_name?: string;
  updated_at?: Date;
}