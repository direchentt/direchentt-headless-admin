import { NextResponse } from 'next/server';

/**
 * Endpoint de instalación de la app en TiendaNube
 * 
 * Este endpoint inicia el flujo OAuth solicitando los scopes necesarios:
 * - read_products: Leer información de productos
 * - read_orders: Leer órdenes existentes
 * - write_orders: CRÍTICO - Crear draft orders para checkout
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
        return NextResponse.json(
            { error: 'Falta el parámetro shop (store ID)' },
            { status: 400 }
        );
    }

    const clientId = process.env.TIENDANUBE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`;

    // Scopes necesarios para la app
    const scopes = [
        'read_products',   // Leer productos
        'read_orders',     // Leer órdenes
        'write_orders'     // CRÍTICO: Crear draft orders
    ].join(',');

    // URL de autorización de TiendaNube
    const authUrl = new URL('https://www.tiendanube.com/apps/authorize/auth');
    authUrl.searchParams.append('client_id', clientId || '');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('state', shop); // Usamos el shop ID como state

    console.log('🔐 Iniciando instalación de app');
    console.log('📋 Scopes solicitados:', scopes);
    console.log('🏪 Store ID:', shop);
    console.log('🔗 Redirect URI:', redirectUri);

    // Redirigir a TiendaNube para autorización
    return NextResponse.redirect(authUrl.toString());
}
