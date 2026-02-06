
'use client';

import { useState } from 'react';

export default function MercadoPagoButton({ items, storeId }: { items: any[], storeId: string }) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/checkout/mercadopago/preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, storeId }),
            });

            const data = await res.json();

            if (data.init_point) {
                // Redirigir al Checkout Pro de Mercado Pago
                window.location.href = data.init_point;
            } else {
                alert('Error al iniciar el pago con Mercado Pago');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#009EE3] hover:bg-[#0089c7] text-white rounded-full transition-all font-bold shadow-sm disabled:opacity-50"
        >
            {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
                <>
                    <img
                        src="https://http2.mlstatic.com/frontend-assets/marketplace-web/mkt-web-navigation/current/mp-logo.svg"
                        alt="Mercado Pago"
                        className="h-6 invert brightness-0"
                    />
                    Pagar con Mercado Pago
                </>
            )}
        </button>
    );
}
