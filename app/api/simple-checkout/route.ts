import { NextResponse } from 'next/server';
import { getStoreData } from '../../../lib/backend';

/**
 * API simplificada para checkout que usa métodos más compatibles
 */
export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1, shop, productId } = await request.json();
    
    console.log('🛒 Checkout simple:', { variantId, quantity, shop, productId });
    
    const storeData = await getStoreData(shop);
    if (!storeData) {
      return NextResponse.json(
        { success: false, error: 'Tienda no encontrada' },
        { status: 404 }
      );
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
    
    console.log('🏪 Usando dominio:', domain);
    
    // Obtener un producto real para testing
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI || "";
    const client = new MongoClient(uri);
    await client.connect();
    
    const realProduct = await client.db('AppRegaloDB').collection('products')
      .findOne({ storeId: shop });
    
    let realVariantId = variantId;
    let realProductHandle = productId;
    
    if (realProduct && realProduct.variants && realProduct.variants.length > 0) {
      realVariantId = realProduct.variants[0].id;
      realProductHandle = realProduct.handle || realProduct.id;
      console.log('📦 Usando producto real:', { 
        id: realProduct.id, 
        handle: realProductHandle, 
        variantId: realVariantId 
      });
    }
    
    await client.close();
    
    // ESTRATEGIAS MEJORADAS CON DATOS REALES
    const strategies = {
      // Método 1: Add to cart tradicional (más confiable)
      traditional: `https://${domain}/cart/add/${realVariantId}`,
      
      // Método 2: Add to cart con query params
      addQuery: `https://${domain}/cart/add?id=${realVariantId}&quantity=${quantity}`,
      
      // Método 3: Producto con variante específica
      product: `https://${domain}/products/${realProductHandle}?variant=${realVariantId}`,
      
      // Método 4: Solo el producto (para agregar manualmente)
      productSimple: `https://${domain}/products/${realProductHandle}`,
      
      // Método 5: Checkout directo
      checkout: `https://${domain}/checkout`,
      
      // Método 6: Carrito
      cart: `https://${domain}/cart`
    };

    return NextResponse.json({
      success: true,
      message: 'URLs de checkout con datos reales generadas',
      strategies,
      recommended: strategies.traditional,
      productData: realProduct ? {
        id: realProduct.id,
        handle: realProductHandle,
        variantId: realVariantId,
        name: realProduct.name
      } : null,
      domain
    });

  } catch (error) {
    console.error('❌ Error en checkout simple:', error);
    return NextResponse.json(
      { success: false, error: 'Error generando checkout' },
      { status: 500 }
    );
  }
}