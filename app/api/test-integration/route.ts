import { NextResponse } from 'next/server';
import { getStoreData } from '../../../lib/backend';

/**
 * API de prueba para verificar la integración con TiendaNube
 * GET /api/test-integration?shop=5112334
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop') || '5112334';
  
  console.log('🧪 Iniciando test de integración para tienda:', shop);
  
  try {
    // 1. Verificar datos de la tienda
    const storeData = await getStoreData(shop);
    if (!storeData) {
      return NextResponse.json({
        success: false,
        error: 'Tienda no encontrada',
        shop
      }, { status: 404 });
    }

    // Usar dominio personalizado conocido para esta tienda específica
    let domain = storeData.domain;
    if (!domain) {
      if (storeData.storeId === '5112334') {
        domain = 'www.direchentt.com.ar';
      } else {
        domain = `${storeData.storeId}.mitiendanube.com`;
      }
    }
    
    console.log('📊 Datos de la tienda:', {
      storeId: storeData.storeId,
      shopName: storeData.shop_name,
      domain: domain,
      hasAccessToken: !!storeData.accessToken,
      accessTokenLength: storeData.accessToken?.length || 0
    });

    // 2. Probar conectividad con la tienda
    const testResults = {
      storeData: {
        storeId: storeData.storeId,
        shopName: storeData.shop_name,
        domain: domain,
        hasAccessToken: !!storeData.accessToken,
        updatedAt: storeData.updated_at
      },
      tests: {}
    };

    // Test 1: Verificar que la tienda responde
    try {
      console.log('🌐 Probando conectividad con:', `https://${domain}`);
      const storeResponse = await fetch(`https://${domain}`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Headless-Integration-Test/1.0' }
      });
      
      testResults.tests.connectivity = {
        success: storeResponse.ok,
        status: storeResponse.status,
        statusText: storeResponse.statusText
      };
    } catch (error) {
      testResults.tests.connectivity = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }

    // Test 2: Probar API de TiendaNube (si hay accessToken)
    if (storeData.accessToken) {
      try {
        console.log('🔑 Probando API de TiendaNube...');
        const apiResponse = await fetch(`https://api.tiendanube.com/v1/${storeData.storeId}/products?limit=1`, {
          headers: {
            'Authorization': `Bearer ${storeData.accessToken}`,
            'User-Agent': 'Headless-Integration-Test/1.0'
          }
        });
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          testResults.tests.api = {
            success: true,
            productsCount: apiData.length || 0,
            message: 'API funcionando correctamente'
          };
        } else {
          testResults.tests.api = {
            success: false,
            status: apiResponse.status,
            error: await apiResponse.text()
          };
        }
      } catch (error) {
        testResults.tests.api = {
          success: false,
          error: error instanceof Error ? error.message : 'Error de API'
        };
      }
    } else {
      testResults.tests.api = {
        success: false,
        error: 'No hay accessToken disponible'
      };
    }

    // Test 3: Generar URLs de prueba
    const testVariantId = '123456789'; // ID de prueba
    testResults.tests.urls = {
      checkoutDirect: `https://${domain}/checkout/v3/start?add_to_cart[0][variant_id]=${testVariantId}&add_to_cart[0][quantity]=1`,
      productPage: `https://${domain}/products/test-product?variant=${testVariantId}&quantity=1`,
      cart: `https://${domain}/cart`,
      checkout: `https://${domain}/checkout`
    };

    console.log('✅ Test completado:', testResults);

    return NextResponse.json({
      success: true,
      message: 'Test de integración completado',
      results: testResults,
      recommendations: generateRecommendations(testResults)
    });

  } catch (error) {
    console.error('❌ Error en test de integración:', error);
    return NextResponse.json({
      success: false,
      error: 'Error ejecutando test',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * Generar recomendaciones basadas en los resultados del test
 */
function generateRecommendations(testResults: any): string[] {
  const recommendations = [];

  if (!testResults.tests.connectivity?.success) {
    recommendations.push('⚠️ La tienda no responde. Verifica que el dominio sea correcto.');
  }

  if (!testResults.tests.api?.success) {
    recommendations.push('🔑 La API de TiendaNube no funciona. Verifica que el accessToken sea válido.');
  } else {
    recommendations.push('✅ API de TiendaNube funcionando. Puedes usar integraciones avanzadas.');
  }

  if (!testResults.storeData.domain) {
    recommendations.push('🏪 Considera agregar un campo "domain" personalizado en MongoDB si usas dominio propio.');
  }

  recommendations.push('🧪 Prueba los URLs generados en tu navegador para verificar que funcionan.');
  
  return recommendations;
}