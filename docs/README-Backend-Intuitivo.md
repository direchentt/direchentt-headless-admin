# 🚀 Backend Intuitivo - Documentación

## ¿Qué es esto?

Un backend **súper fácil de usar** para tu tienda de TiendaNube. Sin complicaciones, sin configuraciones raras. Solo importas y usas.

## 🎯 Uso Rápido

### En Server Components (páginas de Next.js):

```typescript
import { crearTienda } from '../lib/tienda-intuitiva';

export default async function MiPagina() {
  const tienda = crearTienda('5112334'); // Tu ID de tienda
  
  // Obtener todos los productos
  const productos = await tienda.productos.todos();
  
  // Obtener productos de una categoría
  const camisetas = await tienda.productos.todos({ categoria: '123' });
  
  // Buscar productos
  const ofertas = await tienda.productos.buscar('oferta');
  
  return <div>{/* Tu HTML */}</div>;
}
```

### En Client Components (componentes de React):

```typescript
'use client';
import { useProductos, useProducto } from '../lib/cliente-simple';

function MiComponente() {
  const { productos, loading } = useProductos('5112334');
  const { producto } = useProducto('456', '5112334');
  
  if (loading) return <div>Cargando...</div>;
  
  return <div>{/* Tu HTML */}</div>;
}
```

## 📚 Métodos Disponibles

### `tienda.productos`

- `todos(filtros?)` - Obtener todos los productos
- `obtener(id)` - Obtener un producto específico  
- `buscar(termino)` - Buscar productos por término
- `relacionados(id)` - Obtener productos relacionados

### `tienda.categorias`

- `todas()` - Obtener todas las categorías organizadas
- `productos(categoriaId)` - Productos de una categoría

### `tienda.buscar`

- `simple(termino)` - Búsqueda simple
- `avanzada(opciones)` - Búsqueda con filtros

### `tienda.info`

- `obtener()` - Información básica de la tienda

## 🔗 APIs REST Disponibles

### Productos
- `GET /api/simple/productos?shop=ID&categoria=CAT&buscar=TERMINO&limite=N`
- `GET /api/simple/producto/ID?shop=SHOP`

### Categorías  
- `GET /api/simple/categorias?shop=ID`

### Búsqueda
- `GET /api/simple/buscar?shop=ID&q=TERMINO&categoria=CAT&precioMin=MIN&precioMax=MAX`

## 🎨 Hooks de React

### `useProductos(shopId, filtros)`
```typescript
const { productos, loading, error } = useProductos('5112334', {
  categoria: '123',
  limite: 20,
  orden: 'precio'
});
```

### `useProducto(id, shopId)`
```typescript
const { producto, relacionados, loading } = useProducto('456', '5112334');
```

### `useCategorias(shopId)`
```typescript
const { categorias, loading } = useCategorias('5112334');
```

### `useBusqueda(termino, opciones, shopId)`
```typescript
const { resultados, loading } = useBusqueda('camiseta', { limite: 5 }, '5112334');
```

## 🌟 Características

### ✅ Datos Formateados Automáticamente
Los productos vienen con:
- `precio` - Número
- `precioFormateado` - String con formato de moneda
- `imagenPrincipal` - URL de la imagen principal
- `tieneStock` - Boolean si hay stock
- `url` - URL lista para usar

### ✅ Manejo de Errores Incluido
```typescript
const { productos, error } = useProductos('5112334');
if (error) {
  console.log('Error:', error); // Mensaje claro del error
}
```

### ✅ Respuestas Consistentes
Todas las APIs devuelven:
```json
{
  "exito": true,
  "tienda": { "id": "...", "nombre": "..." },
  "productos": [...],
  "total": 10
}
```

### ✅ Filtros Intuitivos
```typescript
// Buscar camisetas rojas baratas
const productos = await tienda.buscar.avanzada({
  termino: 'camiseta roja',
  precioMax: 5000,
  limite: 10
});
```

## 🚀 Ejemplos Completos

Ver archivo `docs/ejemplos-uso.tsx` para ejemplos completos de:
- Header con búsqueda inteligente
- Lista de productos con filtros
- Página de producto con relacionados
- Búsqueda avanzada
- Categorías jerárquicas

## ⚡ Performance

- **Caché automático** - Las consultas se cachean por 60 segundos
- **Lazy loading** - Solo carga datos cuando los necesitas
- **Filtros optimizados** - Usa la API de TiendaNube eficientemente

## 🔧 Configuración

Solo necesitas tu **ID de tienda** de TiendaNube. El resto está configurado automáticamente.

```typescript
// Por defecto usa '5112334'
const tienda = crearTienda();

// O especifica tu ID
const tienda = crearTienda('TU_SHOP_ID');
```

## 🆘 Ayuda Rápida

### ❓ ¿Cómo obtengo mi Shop ID?
Es el número que aparece en tu URL de TiendaNube: `tutienda.tiendanube.com` → busca en la base de datos.

### ❓ ¿Dónde van mis datos?
- **MongoDB** - Configuración de tu tienda 
- **TiendaNube API** - Productos, categorías, etc.
- **Tu frontend** - Todo ya formateado y listo

### ❓ ¿Funciona en producción?
¡Sí! Solo cambia la URL base en `cliente-simple.ts` por tu dominio de producción.

## 🎉 ¡Listo para usar!

Ya tienes todo configurado. Solo importa y empieza a usar:

```typescript
import { crearTienda } from '../lib/tienda-intuitiva';
const tienda = crearTienda('TU_SHOP_ID');
const productos = await tienda.productos.todos();
```