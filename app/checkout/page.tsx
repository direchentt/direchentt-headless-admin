'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MercadoPagoButton from '../components/MercadoPagoButton';
import StoreImage from '../components/StoreImage';
import { formatPrice, parseMoney } from '@/lib/product-utils';

const DEFAULT_SHOP = process.env.NEXT_PUBLIC_DEFAULT_SHOP || '5112334';

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

    const total = items.reduce(
      (acc, item) => acc + Math.round(parseMoney(item.price)) * item.quantity,
      0
    );

    if (loading) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-screen gap-4 bg-zinc-50"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div
                    className="h-10 w-10 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin"
                    aria-hidden
                />
                <p className="text-sm font-medium text-zinc-600">Cargando tu carrito…</p>
            </div>
        );
    }

    if (items.length === 0) {
        const home = `/?shop=${encodeURIComponent(DEFAULT_SHOP)}`;
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 bg-zinc-50">
                <div className="max-w-md w-full text-center bg-white border border-zinc-200 rounded-2xl shadow-sm px-8 py-12">
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900">Tu carrito está vacío</h1>
                    <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                        Agregá productos desde la tienda y volvé acá para completar el pago con Mercado Pago.
                    </p>
                    <Link
                        href={home}
                        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                    >
                        Ir a la tienda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Resumen del Pedido */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Finalizar compra</h1>
                    <p className="text-sm text-zinc-500 -mt-2">Revisá los productos y completá el pago.</p>
                    <div className="border-t border-zinc-100 pt-6">
                        {items.map((item) => (
                            <div key={item.variantId} className="flex gap-4 mb-6">
                                <div className="relative w-20 h-24 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <StoreImage
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      style={{ objectFit: 'cover' }}
                                      sizes="80px"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-sm">{item.name}</h3>
                                    <p className="text-zinc-500 text-xs mt-1">S / Black</p>
                                    <p className="text-zinc-500 text-xs">Cant: {item.quantity}</p>
                                </div>
                                <p className="font-medium text-sm">{formatPrice(Math.round(parseMoney(item.price)) * item.quantity)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-zinc-100 pt-6 space-y-2">
                        <div className="flex justify-between text-zinc-500 text-sm">
                            <span>Subtotal</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500 text-sm">
                            <span>Envío</span>
                            <span className="text-green-600">Gratis</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-4">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
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
