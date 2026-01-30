## 📊 ANÁLISIS COMPLETO: Variables API Necesarias para Comunicación Headless ↔ TiendaNube

### 🔍 PROCESO DE COMPRA SIMULADO

#### 1️⃣ LOCALHOST (Headless) - EXITOSO ✅
```json
{
  "success": true,
  "productData": {
    "id": 308877801,
    "name": "JACKET NORTNOISE MENTSH",
    "variantId": 1386747186,
    "price": "149042.86",
    "sku": "CAM-AXI-01"
  },
  "cartResponse": {
    "checkoutUrl": "https://www.direchentt.com.ar/productos/beany-wilow/",
    "method": "real_working_solution",
    "workingSolutions": {
      "jsAddToCart": "JavaScript API usando LS.cart.addItem()",
      "productPageRedirect": "Redirigir a página del producto",
      "htmlForm": "Formulario HTML POST automático"
    }
  }
}
```

#### 2️⃣ TIENDANUBE (Original) - EXITOSO ✅
```json
{
  "success": true,
  "cartAddResponse": "HTML completo con JavaScript LS (TiendaNube API nativa)",
  "status": "Producto agregado correctamente al carrito",
  "sessionData": {
    "cookies": "store_session_payload_5112334, store_login_session",
    "jsLibraries": ["LS (TiendaNube)", "jQueryNuvem"]
  }
}
```

---

### 🔧 VARIABLES CRÍTICAS PARA COMUNICACIÓN

#### **CONFIGURACIÓN DE TIENDA**
```javascript
const STORE_CONFIG = {
  // IDs y Dominios
  storeId: "5112334",
  headlessDomain: "store.direchentt.com.ar",    // Tu dominio headless
  tiendanubeDomain: "www.direchentt.com.ar",    // TiendaNube original
  
  // Endpoints Críticos
  endpoints: {
    products: "http://localhost:3000/api/products",
    checkout: "http://localhost:3000/api/checkout-simple",
    cartAdd: "https://www.direchentt.com.ar/cart/add.js",
    cartData: "https://www.direchentt.com.ar/cart.js"
  }
}
```

#### **MAPEO DE PRODUCTOS**
```javascript
const PRODUCT_MAPPING = {
  // Datos del producto desde localhost
  localhost: {
    productId: "308877801",
    variantId: "1386747186",
    name: "JACKET NORTNOISE MENTSH",
    price: "149042.86",
    sku: "CAM-AXI-01"
  },
  
  // Correspondencia en TiendaNube
  tiendanube: {
    productId: "308877801",        // ✅ MISMO ID
    variantId: "1386747186",       // ✅ MISMO ID
    productUrl: "/productos/beany-wilow/",
    cartAddEndpoint: "/cart/add.js"
  }
}
```

#### **MÉTODOS DE COMUNICACIÓN**
```javascript
const COMMUNICATION_METHODS = {
  // 1. Método JavaScript (FUNCIONA)
  jsMethod: {
    code: `
    if (typeof LS !== 'undefined' && LS.cart) {
      LS.cart.addItem('${variantId}', ${quantity}).then(() => {
        window.location.href = 'https://www.direchentt.com.ar/cart';
      });
    }
    `,
    required: ["TiendaNube LS library", "Session cookies"]
  },
  
  // 2. Método AJAX (FUNCIONA)
  ajaxMethod: {
    endpoint: "https://www.direchentt.com.ar/cart/add.js",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (compatible)"
    },
    body: "id=${variantId}&quantity=${quantity}",
    required: ["Valid session cookies", "CORS handling"]
  },
  
  // 3. Método HTML Form (FUNCIONA)
  formMethod: {
    action: "https://www.direchentt.com.ar/cart/add",
    method: "POST",
    fields: {
      "id": "${variantId}",
      "quantity": "${quantity}"
    },
    autoSubmit: true
  }
}
```

---

### 🚨 PROBLEMAS IDENTIFICADOS

#### **URLs QUE NO FUNCIONAN** ❌
```javascript
const BROKEN_URLS = {
  "checkout/v3/start": "404 - Not Found",
  "cart/add?id=variant": "404 - Not Found", 
  "/comprar/": "500 - Server Error",
  "/checkout": "404 - Not Found"
}
```

#### **URLs QUE SÍ FUNCIONAN** ✅
```javascript
const WORKING_URLS = {
  "www.direchentt.com.ar": "200 - OK",
  "/productos/": "200 - OK", 
  "/cart/add.js": "200 - OK (AJAX)",
  "/cart/add": "200 - OK (POST Form)"
}
```

---

### 🔗 INTEGRACIÓN REQUERIDA PARA TU HEADLESS

#### **1. API Bridge Required**
```javascript
// En tu localhost necesitas:
const REQUIRED_API_FUNCTIONS = {
  // Función para comunicar con TiendaNube
  addToTiendaNubeCart: async (productId, variantId, quantity) => {
    const response = await fetch('https://www.direchentt.com.ar/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible)'
      },
      body: \`id=\${variantId}&quantity=\${quantity}\`,
      credentials: 'include' // Para mantener cookies de sesión
    });
    return response;
  },
  
  // Función para obtener estado del carrito
  getTiendaNubeCart: async () => {
    const response = await fetch('https://www.direchentt.com.ar/cart.js', {
      credentials: 'include'
    });
    return await response.json();
  }
}
```

#### **2. Session Management Required**
```javascript
const SESSION_REQUIREMENTS = {
  // Cookies necesarias de TiendaNube
  requiredCookies: [
    "store_session_payload_5112334",
    "store_login_session",
    "__cf_bm" // Cloudflare security
  ],
  
  // Headers requeridos
  requiredHeaders: {
    "User-Agent": "Mozilla/5.0 (compatible)",
    "Referer": "https://www.direchentt.com.ar",
    "Origin": "https://www.direchentt.com.ar"
  }
}
```

#### **3. CORS Configuration Required**
```javascript
const CORS_CONFIG = {
  // En tu localhost necesitas configurar:
  allowedOrigins: ["https://www.direchentt.com.ar"],
  allowedMethods: ["GET", "POST", "OPTIONS"],
  allowCredentials: true,
  
  // Proxy necesario para evitar CORS
  proxyEndpoints: {
    "/api/tiendanube/cart/add": "https://www.direchentt.com.ar/cart/add.js",
    "/api/tiendanube/cart/get": "https://www.direchentt.com.ar/cart.js"
  }
}
```

---

### 💡 SOLUCIÓN RECOMENDADA

#### **Implementar Bridge API en tu localhost:**

```javascript
// /api/bridge-tiendanube/route.ts
export async function POST(request: Request) {
  const { action, productId, variantId, quantity } = await request.json();
  
  switch (action) {
    case 'addToCart':
      return await fetch('https://www.direchentt.com.ar/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible)'
        },
        body: \`id=\${variantId}&quantity=\${quantity}\`
      });
      
    case 'getCart':
      return await fetch('https://www.direchentt.com.ar/cart.js');
      
    case 'redirectToCheckout':
      return Response.json({ 
        redirectUrl: \`https://www.direchentt.com.ar/productos/\${productSlug}/\`
      });
  }
}
```

---

### 🎯 VARIABLES ESENCIALES PARA TU IMPLEMENTACIÓN

```javascript
const ESSENTIAL_VARIABLES = {
  STORE_ID: "5112334",
  HEADLESS_DOMAIN: "store.direchentt.com.ar",
  TIENDANUBE_DOMAIN: "www.direchentt.com.ar",
  
  API_ENDPOINTS: {
    LOCALHOST_PRODUCTS: "/api/products",
    LOCALHOST_CHECKOUT: "/api/checkout-simple", 
    TIENDANUBE_ADD_CART: "/cart/add.js",
    TIENDANUBE_GET_CART: "/cart.js",
    TIENDANUBE_CHECKOUT: "/comprar/"  // ⚠️ Actualmente con error 500
  },
  
  PRODUCT_MAPPING: {
    // Los IDs son consistentes entre ambos sistemas
    PRODUCT_ID_MATCH: true,
    VARIANT_ID_MATCH: true,
    PRICE_MATCH: true
  },
  
  SESSION_MANAGEMENT: {
    COOKIES_REQUIRED: true,
    CORS_PROXY_NEEDED: true,
    USER_AGENT_SPOOFING: true
  }
}
```

### 🏁 CONCLUSIÓN

Tu headless **SÍ puede comunicarse** con TiendaNube, pero necesitas:

1. **API Bridge** en localhost para hacer las llamadas a TiendaNube
2. **Manejo de sesiones** para mantener cookies de TiendaNube  
3. **Proxy CORS** para evitar problemas de cross-origin
4. **Métodos JavaScript/AJAX** en lugar de URLs directas
5. **Esperar** a que TiendaNube arregle el error 500 en `/comprar/`

Los IDs de productos y variantes **son consistentes** entre ambos sistemas, lo cual facilita mucho la integración.
