# Integración Headless → TiendaNube - Guía de Implementación

## 🎯 Resumen de la Solución

Hemos implementado un sistema completo para redireccionar productos de tu headless al checkout de TiendaNube con las siguientes mejoras:

### ✅ Funcionalidades Implementadas

1. **API de Checkout Mejorada** (`/api/checkout`)
   - Intenta agregar productos automáticamente al carrito
   - Fallback inteligente si falla la integración automática
   - Redirecciona al checkout o al producto según el contexto

2. **API de Sincronización de Carrito** (`/api/cart/sync`)
   - Maneja diferentes estrategias de agregar al carrito
   - Soporte para URLs directas de checkout v3
   - Integración con JavaScript de TiendaNube

3. **Hook de React** (`useCheckout`)
   - Interfaz limpia para los componentes
   - Manejo de estados y errores
   - Notificaciones al usuario

4. **Componente VariantSelector Mejorado**
   - Botones inteligentes que adaptan su comportamiento
   - Estados de carga y error
   - UX mejorada

5. **Script de TiendaNube** (`tiendanube-integration.js`)
   - Para integrar en tu plantilla de TiendaNube
   - Mejora la comunicación entre ambas plataformas

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Asegúrate de tener en tu `.env.local`:

```env
MONGODB_URI=tu_mongodb_uri
# Opcional: Si tienes access tokens de TiendaNube
TIENDANUBE_ACCESS_TOKEN=tu_access_token
```

### 2. Base de Datos (MongoDB)

Tu colección `stores` debe tener esta estructura (basada en tus datos actuales):

```javascript
{
  _id: ObjectId("697981a53a445389f07e7a05"),
  storeId: "5112334",
  accessToken: "c86fd202a455f38ae764a805475f9f960e8ae33f", // ✅ Tienes esto!
  shop_name: "Tienda Nueva",
  updated_at: ISODate("2026-01-28T03:25:25.207Z"),
  
  // Opcional - si no está, se usa storeId.mitiendanube.com
  domain: "tu-tienda-custom.com" 
}
```

**📊 Estado de tu configuración:**
- ✅ **storeId**: Configurado correctamente
- ✅ **accessToken**: Disponible (permite integraciones avanzadas)
- ✅ **shop_name**: Configurado
- ⚠️ **domain**: Se generará automáticamente como `5112334.mitiendanube.com`

### 3. En tu TiendaNube (Opcional pero Recomendado)

Agrega este script a tu plantilla de TiendaNube (en `templates/layout.twig` antes del `</body>`):

```html
<script>
  // Configurar el dominio de tu headless
  window.HEADLESS_DOMAIN = 'https://tu-headless.vercel.app';
</script>
<script src="{{ 'tiendanube-integration.js' | asset_url }}"></script>
```

## 🚀 Cómo Funciona

### Flujo de "Agregar al Carrito"

1. Usuario selecciona variante y hace clic en "Agregar al carrito"
2. Se llama a `/api/cart/sync`
3. El sistema intenta diferentes estrategias:
   - **Estrategia 1**: Usar API de TiendaNube (si hay access token)
   - **Estrategia 2**: Redireccionar al producto con parámetros
4. Se abre nueva ventana con el producto en TiendaNube
5. Usuario puede agregarlo manualmente si es necesario

### Flujo de "Comprar Ahora"

1. Usuario hace clic en "Comprar ahora"
2. Se llama a `/api/checkout`
3. El sistema intenta:
   - **Opción A**: Agregar al carrito y redireccionar al checkout
   - **Opción B**: Redireccionar al producto para que lo agregue manualmente
4. Se abre el checkout o producto en nueva ventana

## 📱 URLs de TiendaNube Soportadas

### Checkout Directo (Más Rápido)
```
https://tu-tienda.mitiendanube.com/checkout/v3/start?add_to_cart[0][variant_id]=123&add_to_cart[0][quantity]=1
```

### Producto con Variante (Más Confiable)
```
https://tu-tienda.mitiendanube.com/products/producto-123?variant=456&quantity=1
```

### Con Script de Integración
```
https://tu-tienda.mitiendanube.com/products/producto-123?add_variant=456&quantity=1&redirect=checkout
```

## 🔄 Estrategias de Integración

El sistema usa múltiples estrategias para máxima compatibilidad:

1. **JavaScript API**: Si el usuario está en el dominio de TiendaNube
2. **Checkout Directo**: Si tienes access token y la tienda lo soporta
3. **Producto con Parámetros**: Fallback más confiable
4. **Formulario POST**: Para casos especiales

## 🛠 Próximos Pasos Recomendados

### Para Mejorar la Integración:

1. **Obtén Access Tokens de TiendaNube**
   ```javascript
   // En tu app de TiendaNube, guarda el access token
   const storeData = {
     storeId: "5112334",
     accessToken: "access_token_from_oauth",
     domain: "custom-domain.com"
   };
   ```

2. **Personaliza las Notificaciones**
   - Modifica `useCheckout.ts` para usar tu sistema de notificaciones
   - Integra con toast libraries (react-hot-toast, etc.)

3. **Mejora el Tracking**
   ```javascript
   // En el hook useCheckout
   onSuccess: (result) => {
     // Agregar tracking de Google Analytics/Facebook Pixel
     gtag('event', 'add_to_cart', {
       currency: 'ARS',
       value: variant.price,
       items: [{ item_id: variant.id, ... }]
     });
   }
   ```

4. **Implementa Carrito Local (Opcional)**
   - Para mejor UX, mantén un carrito local
   - Sincroniza con TiendaNube al hacer checkout

## ⚠️ Limitaciones Actuales

1. **Dependencia del Popup**: Requiere que el navegador permita popups
2. **Sin Carrito Sincronizado**: No hay carrito unificado entre ambas plataformas
3. **Variantes Complejas**: Puede requerir ajustes para productos con muchas variantes

## 🧪 Testing

Para probar la integración:

1. **Test de Configuración**:
   ```
   http://localhost:3000/api/test-integration?shop=5112334
   ```
   Este endpoint verificará tu configuración actual.

2. **Desarrollo Local**:
   ```bash
   npm run dev
   ```

3. **Probar URLs Generadas**:
   ```
   # Checkout directo con tu tienda
   https://5112334.mitiendanube.com/checkout/v3/start?add_to_cart[0][variant_id]=VARIANT_ID&add_to_cart[0][quantity]=1
   
   # Producto con variante
   https://5112334.mitiendanube.com/products/PRODUCT_ID?variant=VARIANT_ID&quantity=1
   ```

4. **Probar API de Checkout**:
   ```javascript
   // En consola del navegador
   fetch('/api/checkout', {
     method: 'POST', 
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       variantId: '123',
       quantity: 1,
       shop: '5112334',
       productId: 'producto-123'
     })
   }).then(r => r.json()).then(console.log);
   ```

3. **Verificar Logs**:
   - Revisa la consola del navegador
   - Revisa los logs del servidor de Next.js

## 📞 Soporte

Si necesitas ayuda adicional o quieres implementar funcionalidades específicas:

1. **Logs**: Siempre revisa los logs en consola
2. **Errores Comunes**: 
   - Popup bloqueado → Instruye al usuario a permitir popups
   - Variante no encontrada → Verifica que el ID de variante sea correcto
   - Tienda no encontrada → Verifica que el storeId exista en MongoDB

Esta integración te da múltiples caminos para que tus usuarios puedan comprar, maximizando la compatibilidad con diferentes configuraciones de TiendaNube. 🎉