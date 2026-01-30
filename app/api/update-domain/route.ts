import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { storeId, domain } = await request.json();
    
    if (!storeId || !domain) {
      return NextResponse.json({ 
        success: false, 
        error: 'storeId y domain son requeridos' 
      }, { status: 400 });
    }

    const uri = process.env.MONGODB_URI || "";
    if (!uri) {
      throw new Error("MONGODB_URI no definida");
    }

    const client = new MongoClient(uri);
    await client.connect();

    const result = await client.db('AppRegaloDB').collection('stores').updateOne(
      { storeId },
      { 
        $set: { 
          domain: domain,
          updated_at: new Date()
        } 
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tienda no encontrada' 
      }, { status: 404 });
    }

    console.log(`✅ Dominio actualizado para tienda ${storeId}: ${domain}`);

    return NextResponse.json({ 
      success: true, 
      message: `Dominio actualizado a: ${domain}`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error actualizando dominio:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}