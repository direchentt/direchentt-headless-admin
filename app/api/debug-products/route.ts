import { NextResponse } from 'next/server';
import { getStoreData } from '../../../lib/backend';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || '5112334';
    
    const storeData = await getStoreData(shop);
    if (!storeData) {
      return NextResponse.json({ success: false, error: 'Tienda no encontrada' });
    }

    // Obtener productos reales de MongoDB
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI || "";
    const client = new MongoClient(uri);
    await client.connect();
    
    const products = await client.db('AppRegaloDB').collection('products')
      .find({ storeId: shop })
      .limit(5)
      .toArray();
    
    await client.close();

    // Dominio
    let domain = storeData.domain;
    if (!domain) {
      if (storeData.storeId === '5112334') {
        domain = 'www.direchentt.com.ar';
      } else {
        domain = `${storeData.storeId}.mitiendanube.com`;
      }
    }

    // Debug info
    const debugInfo = products.map((product: any) => ({
      mongoId: product._id,
      productId: product.id,
      handle: product.handle,
      name: product.name,
      variants: product.variants ? product.variants.slice(0, 2).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        price: v.price
      })) : [],
      // Generar URLs de prueba
      urls: {
        byId: `https://${domain}/products/${product.id}`,
        byHandle: `https://${domain}/products/${product.handle}`,
        direct: `https://${domain}/cart/add/${product.variants?.[0]?.id}`
      }
    }));

    return NextResponse.json({
      success: true,
      domain,
      totalProducts: products.length,
      sampleProducts: debugInfo,
      accessTokenStatus: storeData.accessToken ? 'present' : 'missing'
    });

  } catch (error) {
    console.error('Error debug:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}