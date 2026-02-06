
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getStoreData } from '../../../../../lib/backend';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic') || req.headers.get('x-topic');
    const id = searchParams.get('id') || searchParams.get('data.id');

    console.log(`🔔 Notificación de Mercado Pago recibida: ${topic} ID: ${id}`);

    // Mercado Pago envía notificaciones por 'payment' o 'merchant_order'
    let dataType = '';
    try {
        const body = await req.json();
        dataType = body.type || '';
    } catch (e) {
        // Si no hay body JSON, ignoramos
    }

    if (topic === 'payment' || dataType === 'payment') {
        try {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: String(id) });

            if (paymentData.status === 'approved') {
                const { store_id, cart_items } = paymentData.metadata;
                const items = JSON.parse(cart_items);

                console.log(`✅ Pago MP aprobado para tienda ${store_id}`);

                // Lógica de creación de orden en Tiendanube (Reutilizada)
                const storeData = await getStoreData(store_id);
                if (storeData && storeData.accessToken) {
                    const API_BASE = `https://api.tiendanube.com/v1/${store_id}`;

                    await fetch(`${API_BASE}/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authentication': `bearer ${storeData.accessToken}`,
                            'User-Agent': 'direchentt-headless',
                        },
                        body: JSON.stringify({
                            products: items.map((i: any) => ({
                                variant_id: i.id,
                                quantity: i.q
                            })),
                            payment_status: 'paid',
                            shipping_status: 'unpacked',
                        }),
                    });
                    console.log(`🎉 Orden creada en Tiendanube tras pago de Mercado Pago`);
                }
            }
        } catch (error) {
            console.error('❌ Error procesando webhook de Mercado Pago:', error);
        }
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
