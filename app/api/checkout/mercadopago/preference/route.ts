
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

export async function POST(req: NextRequest) {
    try {
        const { items, storeId } = await req.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
        }

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: items.map((item: any) => ({
                    id: item.variantId,
                    title: item.name,
                    unit_price: parseFloat(item.price),
                    quantity: parseInt(item.quantity),
                    currency_id: 'ARS',
                })),
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending`,
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/mercadopago/webhook`,
                metadata: {
                    store_id: storeId || '5112334',
                    cart_items: JSON.stringify(items.map((i: any) => ({ id: i.variantId, q: i.quantity })))
                }
            }
        });

        return NextResponse.json({
            id: result.id,
            init_point: result.init_point, // URL para checkout Pro
        });
    } catch (error) {
        console.error('❌ Error creando preferencia de Mercado Pago:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
