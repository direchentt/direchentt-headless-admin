import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/backend';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'No se recibió el código' }, { status: 400 });

  try {
    const response = await fetch("https://www.tiendanube.com/apps/authorize/token", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.TIENDANUBE_CLIENT_ID,
        client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
        grant_type: "authorization_code",
        code
      })
    });

    const data = await response.json();

    if (data.access_token) {
      const client = await getMongoClient();
      // Forzamos el uso de AppRegaloDB
      const database = client.db('AppRegaloDB');
      const stores = database.collection('stores');

      console.log('✅ Token recibido de TiendaNube');
      console.log('🏪 Store ID:', data.user_id);
      console.log('📋 Scopes otorgados:', data.scope || 'No especificado');

      await stores.updateOne(
        { storeId: data.user_id.toString() },
        {
          $set: {
            accessToken: data.access_token,
            shop_name: data.organization || "Tienda Nueva",
            scopes: data.scope || null, // Guardar scopes otorgados
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

      console.log('💾 Token guardado en MongoDB');

      // Redirigimos a la Home con el parámetro shop para que el Dashboard te reconozca
      return NextResponse.redirect(`https://direchentt-headless-admin.vercel.app/?shop=${data.user_id}`);
    }
    return NextResponse.json({ error: 'Error en el Token', data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}