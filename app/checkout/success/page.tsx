
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SuccessPage() {
    useEffect(() => {
        // Limpiar el carrito después de un pago exitoso
        localStorage.removeItem('cart');
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">¡Pago Exitoso!</h1>
            <p className="text-zinc-500 max-w-md mb-8">
                Tu pedido ha sido procesado correctamente. Recibirás un correo de confirmación en breve y podrás ver el estado en tu panel de Tiendanube.
            </p>
            <Link
                href="/"
                className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-zinc-800 transition-all"
            >
                Volver a la tienda
            </Link>
        </div>
    );
}
