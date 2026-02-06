
'use client';

import { useEffect, useState } from 'react';
import MercadoPagoButton from '../components/MercadoPagoButton';

// Definición de tipo para los items del carrito
interface CartItem {
    id: string;
    variantId: string;
    name: string;
    price: string;
    quantity: number;
    image: string;
}

export default function CheckoutPage() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Obtener items del carrito (simulamos que están en localStorage)
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            const parsedItems = JSON.parse(savedCart);
            setItems(parsedItems);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, []);

    const total = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="p-12 text-center">
                <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
                <p className="mt-4 text-zinc-500">Agrega algunos productos antes de finalizar la compra.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Resumen del Pedido */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold tracking-tight">Finalizar Compra</h1>
                    <div className="border-t border-zinc-100 pt-6">
                        {items.map((item) => (
                            <div key={item.variantId} className="flex gap-4 mb-6">
                                <div className="w-20 h-24 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-sm">{item.name}</h3>
                                    <p className="text-zinc-500 text-xs mt-1">S / Black</p>
                                    <p className="text-zinc-500 text-xs">Cant: {item.quantity}</p>
                                </div>
                                <p className="font-medium text-sm">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-zinc-100 pt-6 space-y-2">
                        <div className="flex justify-between text-zinc-500 text-sm">
                            <span>Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500 text-sm">
                            <span>Envío</span>
                            <span className="text-green-600">Gratis</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-4">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Formulario de Pago */}
                <div className="space-y-8">
                    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <h3 className="text-lg font-bold mb-6 italic">Finalizar con Mercado Pago</h3>
                        <MercadoPagoButton items={items} storeId="5112334" />
                        <p className="text-[10px] text-zinc-400 text-center mt-4">
                            Paga de forma segura con Tarjetas, Efectivo o Dinero en cuenta.
                        </p>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs text-blue-700 text-center">
                            🔓 Tu pago está protegido por Mercado Pago.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
