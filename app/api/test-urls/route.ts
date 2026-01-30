import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1 } = await request.json();
    
    console.log('🧪 Testing checkout URLs en vivo:', { variantId, quantity });

    const testResults = [];
    const baseUrl = 'https://www.direchentt.com.ar';

    // URLs para probar
    const urlsToTest = [
      // URLs básicas
      { name: 'Cart básico', url: `${baseUrl}/cart` },
      { name: 'Checkout básico', url: `${baseUrl}/checkout` },
      
      // URLs de TiendaNube con diferentes formatos
      { name: 'Cart Add ID', url: `${baseUrl}/cart/add?id=${variantId}&quantity=${quantity}` },
      { name: 'Cart Add Variant', url: `${baseUrl}/cart/add?variant=${variantId}&quantity=${quantity}` },
      { name: 'Cart Add Product', url: `${baseUrl}/cart/add?product=${variantId}&quantity=${quantity}` },
      
      // URLs V3 que estábamos generando
      { name: 'V3 Start Variant ID', url: `${baseUrl}/checkout/v3/start?variant_id=${variantId}&quantity=${quantity}&from_store=1&country=AR` },
      { name: 'V3 Start Add', url: `${baseUrl}/checkout/v3/start?add=${variantId}:${quantity}&from_store=1&country=AR` },
      
      // URLs alternativas
      { name: 'Checkout con Add', url: `${baseUrl}/checkout?add=${variantId}:${quantity}` },
      { name: 'Checkout con Variant', url: `${baseUrl}/checkout?variant=${variantId}&quantity=${quantity}` },
      
      // URLs que sabemos que funcionan
      { name: 'Producto Beanie Wilow', url: `${baseUrl}/productos/beany-wilow/` },
    ];

    // Probar cada URL
    for (const testUrl of urlsToTest) {
      try {
        console.log(`🔍 Probando: ${testUrl.name} -> ${testUrl.url}`);
        
        const response = await fetch(testUrl.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'TiendaNube-Test-Bot/1.0'
          },
          signal: AbortSignal.timeout(5000)
        });

        const result = {
          name: testUrl.name,
          url: testUrl.url,
          status: response.status,
          statusText: response.statusText,
          headers: {
            'content-type': response.headers.get('content-type'),
            'location': response.headers.get('location')
          },
          working: response.status >= 200 && response.status < 400
        };

        // Si es un redirect, seguirlo
        if (response.status >= 300 && response.status < 400) {
          result.redirectsTo = response.headers.get('location');
        }

        testResults.push(result);
        console.log(`✅ ${testUrl.name}: ${response.status} ${response.statusText}`);

      } catch (error) {
        const result = {
          name: testUrl.name,
          url: testUrl.url,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
          working: false
        };
        testResults.push(result);
        console.log(`❌ ${testUrl.name}: ERROR - ${result.error}`);
      }
    }

    // Separar resultados
    const workingUrls = testResults.filter(r => r.working);
    const failingUrls = testResults.filter(r => !r.working);

    console.log('📊 Resumen de pruebas:', {
      total: testResults.length,
      working: workingUrls.length,
      failing: failingUrls.length
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: testResults.length,
        working: workingUrls.length,
        failing: failingUrls.length
      },
      workingUrls: workingUrls.map(r => ({ name: r.name, url: r.url, status: r.status })),
      failingUrls: failingUrls.map(r => ({ name: r.name, url: r.url, status: r.status, error: r.error })),
      allResults: testResults,
      recommendation: workingUrls.length > 0 ? 
        `✅ ${workingUrls.length} URLs funcionan. Usa: ${workingUrls[0].name}` :
        '❌ Ninguna URL de checkout funciona. Problema con la configuración de TiendaNube.',
      nextSteps: [
        '1. Revisar URLs que funcionan y ver si redirigen al checkout',
        '2. Analizar si TiendaNube requiere cookies o sesión',
        '3. Intentar con métodos POST en lugar de GET',
        '4. Verificar si necesitamos autenticación'
      ]
    });

  } catch (error) {
    console.error('❌ Error en test URLs:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}