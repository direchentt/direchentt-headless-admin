
'use client';

import Link from 'next/link';

export default function FailurePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Pago no completado</h1>
            <p className="text-zinc-500 max-w-md mb-8">
                Hubo un problema al procesar tu pago o la transacción fue cancelada. Por favor, intenta nuevamente con otro método de pago.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/checkout"
                    className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-zinc-800 transition-all"
                >
                    Reintentar checkout
                </Link>
                <Link
                    href="/"
                    className="px-8 py-3 bg-zinc-100 text-black rounded-full font-medium hover:bg-zinc-200 transition-all"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
