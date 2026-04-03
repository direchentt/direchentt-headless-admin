import { NextResponse } from 'next/server';
import { getStoreData } from '../../../../lib/backend';

/**
 * Endpoint para crear checkout usando Cart API de TiendaNube
 * 
 * Este es el enfoque correcto para checkout headless:
 * - Usa Cart API (no Draft Orders)
 * - Genera permalinks reales de checkout
 * - No requiere scope write_orders
 * - Funciona como inpro.ar
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items } = body;

        console.log('🛒 Creando checkout con Cart API:', { items });

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'No hay items en el carrito' },
                { status: 400 }
            );
        }

        // Obtener token y configuración
        let accessToken = process.env.TIENDANUBE_TOKEN;
        let storeId = process.env.TIENDANUBE_STORE_ID;

        // Si no hay token en .env, intentar obtenerlo desde MongoDB
        if (!accessToken) {
            console.log('⚠️ No hay token en .env.local, intentando obtener desde MongoDB...');
            try {
                const storeData = await getStoreData('5112334');
                if (storeData && storeData.accessToken) {
                    accessToken = storeData.accessToken;
                    console.log('✅ Token obtenido desde MongoDB');
                } else {
                    throw new Error('No se encontró token en MongoDB');
                }
            } catch (error) {
                console.error('❌ Error al obtener token desde MongoDB:', error);
                return NextResponse.json(
                    {
                        error: 'No se encontró token de acceso',
                        suggestion: 'Configura TIENDANUBE_TOKEN en .env.local'
                    },
                    { status: 401 }
                );
            }
        }

        console.log('🏪 Store configurado:', {
            storeId,
            hasToken: !!accessToken,
            tokenLength: accessToken?.length
        });

        // Transformar items al formato de TiendaNube
        const lineItems = items.map((item: any) => ({
            variant_id: parseInt(item.variantId || item.variant_id),
            quantity: parseInt(item.quantity) || 1
        }));

        console.log('📦 Line items para Cart API:', lineItems);

        // Crear carrito usando Cart API
        const apiUrl = `https://api.tiendanube.com/v1/${storeId}/carts`;

        console.log('🌐 Llamando a Cart API:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authentication': `bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'DirechenttHeadless (contact@direchentt.com)'
            },
            body: JSON.stringify({
                cart: {
                    line_items: lineItems
                }
            })
        });

        console.log('📡 Respuesta de Cart API:', {
            status: response.status,
            statusText: response.statusText
        });

        const responseBody = await response.text();
        console.log('📄 Response body:', responseBody);

        if (!response.ok) {
            console.error('❌ Error de Cart API:', {
                status: response.status,
                body: responseBody
            });

            return NextResponse.json(
                {
                    error: 'Error al crear carrito',
                    details: responseBody,
                    status: response.status
                },
                { status: response.status }
            );
        }

        const data = JSON.parse(responseBody);

        // El permalink está en data.permalink
        const checkoutUrl = data.permalink;

        if (!checkoutUrl) {
            console.error('❌ No se recibió permalink en la respuesta');
            return NextResponse.json(
                {
                    error: 'No se generó permalink de checkout',
                    data
                },
                { status: 500 }
            );
        }

        console.log('✅ Carrito creado exitosamente');
        console.log('🔗 Checkout Permalink:', checkoutUrl);

        return NextResponse.json({
            success: true,
            checkoutUrl,
            cartId: data.id,
            method: 'cart_api_permalink'
        });

    } catch (error: any) {
        console.error('❌ Error al crear checkout:', error);

        return NextResponse.json(
            {
                error: 'Error al crear checkout',
                details: error.message
            },
            { status: 500 }
        );
    }
}
