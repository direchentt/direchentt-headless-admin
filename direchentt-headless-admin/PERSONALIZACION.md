# 🎨 GUÍA DE PERSONALIZACIÓN - DIRECHENTT HEADLESS

## Estructura Completada ✅

Tu tienda headless ahora tiene la estructura completa de **Scuffers** con:

### 📦 Componentes Implementados
- ✅ **Header** - Navegación con menú hamburguesa (mobile-first)
- ✅ **HeroSlider** - Carrusel de 10 imágenes con animaciones modernas
- ✅ **FeaturedSection** - Grid responsivo con categorías destacadas
- ✅ **ProductGrid** - Grilla de 2/3/4 columnas según viewport
- ✅ **ProductCard** - Cards con imagen y precio
- ✅ **VariantSelector** - Selector de color y talla
- ✅ **Footer** - Newsletter + links + social
- ✅ **ScrollReveal** - Animaciones al scroll

---

## 🎯 Cómo Personalizar la Tienda

### 1. CAMBIAR COLORES

Edita `/app/config/theme.ts`:

```typescript
colors: {
  primary: '#000000',      // Botones principales
  text: '#000000',         // Texto
  background: '#ffffff',   // Fondo
  accent: '#f0f0f0',      // Bordes
}
```

**Usa estos colores desde TiendaNube:**
1. Ve a tu dashboard de TiendaNube
2. Obtén tu "color primario" desde **Diseño → Colores**
3. Reemplaza `#000000` con tu color

---

### 2. CAMBIAR TIPOGRAFÍA

```typescript
typography: {
  fontFamily: "tu-fuente-aquí, sans-serif",
  fontSize: {
    xs: '10px',
    sm: '12px',
    base: '14px',
  }
}
```

**Fonts recomendadas:**
- Scuffers usa: `Helvetica Neue, Arial`
- Nude Project usa: `Inter, sans-serif`
- Para elegancia: `Playfair Display, serif`

---

### 3. CAMBIAR IMÁGENES DE BANNERS

Los banners están en `/app/page.tsx`:

```typescript
const defaultBanners = [
  "https://tu-imagen-1.jpg",
  "https://tu-imagen-2.jpg",
  // Agrega las tuyas aquí
];
```

**O usa automáticamente desde TiendaNube API:**
```typescript
// El código ya obtiene banners de TiendaNube
const bannerImages = (banners || [])
  .filter((b: any) => b?.image?.src)
  .map((b: any) => b.image.src);
```

---

### 4. MODIFICAR CATEGORÍAS (DESDE TIENDANUBE)

El header obtiene automáticamente tus categorías desde la API:

```typescript
// En page.tsx
const categories = await fetchTN('categories', storeLocal.storeId, storeLocal.accessToken);
```

**No necesitas cambiar código** - Solo actualiza tus categorías en TiendaNube.

---

### 5. CAMBIAR TEXTOS Y LABELS

**Header:**
```tsx
// En /app/components/Header.tsx
<span className="logo-text">DIRECHENTT</span> // Cambia esto
```

**Footer:**
```tsx
// En /app/components/Footer.tsx
storeName={storeLocal.name || 'DIRECHENTT'} // Usa de TiendaNube
```

---

## 📱 Estructura de Carpetas

```
app/
├── components/
│   ├── Header.tsx              # Navegación
│   ├── HeroSlider.tsx          # Carrusel de banners
│   ├── FeaturedSection.tsx     # Colecciones destacadas
│   ├── ProductGrid.tsx         # Grilla de productos
│   ├── ProductCard.tsx         # Card individual
│   ├── VariantSelector.tsx     # Selector de variantes
│   ├── Footer.tsx              # Pie de página
│   ├── ScrollReveal.tsx        # Animaciones al scroll
│   └── HeroSection.tsx         # (sin usar, puedes eliminar)
├── config/
│   └── theme.ts                # Configuración global
├── product/
│   └── [id]/
│       └── page.tsx            # Página de producto
├── page.tsx                    # Home
└── layout.tsx                  # Layout raíz
```

---

## 🚀 INTEGRACIONES CON TIENDANUBE

### Datos que ya se sincronizan automáticamente:

1. **Productos** ✅
   ```typescript
   fetchTN('products', storeId, token)
   ```

2. **Categorías** ✅
   ```typescript
   fetchTN('categories', storeId, token)
   ```

3. **Banners** ✅
   ```typescript
   fetchTN('banners', storeId, token)
   ```

4. **Variantes** ✅
   ```typescript
   // Ya incluye: color, talla, precio, stock
   ```

### Variable más importante en MongoDB:
```javascript
{
  storeId: "5112334",           // Tu ID de tienda
  accessToken: "tu-token",      // Token API
  domain: "tudominio.com",      // Tu dominio
  logo: "url-logo",             // Logo
  name: "Tu Tienda"             // Nombre
}
```

---

## 🎬 ANIMACIONES DISPONIBLES

**Slider Hero:**
- Auto-play cada 5 segundos
- Transición suave opacity
- Indicadores interactivos
- Contador 01/10

**Featured Section:**
- Zoom en hover
- Overlay gradiente
- Slide up en texto

**Product Grid:**
- Scale 1.05 en hover
- Fade in al cargar

**Scroll Reveal:**
- Fade + slide up automático
- Detectable en viewport

---

## 🔗 VARIABLES CLAVE DE TIENDANUBE

En TiendaNube obtienes automáticamente:

```json
{
  "storeId": "5112334",
  "accessToken": "bearer_token",
  "domain": "tienda.tiendanube.com",
  "logo": "url_logo",
  "name": "Mi Tienda",
  "colors": {
    "primary": "#000000"
  }
}
```

---

## 🎨 PRÓXIMAS MEJORAS SUGERIDAS

1. **Carrito persistente** (localStorage)
2. **Búsqueda** de productos
3. **Filtros** avanzados
4. **Reviews** de productos
5. **Wishlist** (favoritos)
6. **Newsletter** integrada
7. **Analytics** (Google)
8. **PWA** (app installable)

---

## 📞 DEBUGGING

**Si algo no funciona:**

1. Verifica que MongoDB esté corriendo
2. Revisa `.env.local`:
   ```
   MONGODB_URI=mongodb://...
   ```
3. Compila:
   ```bash
   npm run build
   ```
4. Corre en dev:
   ```bash
   npm run dev
   ```

---

## ✅ PRÓXIMOS PASOS

1. **Personaliza colores** en `theme.ts`
2. **Reemplaza images** de banners
3. **Cambia textos** de header/footer
4. **Integra carrito** con TiendaNube
5. **Configura dominio** personalizado
6. **Deploy a Vercel**

¡Tu tienda está lista para enamorar! 🚀
