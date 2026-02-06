
'use client';

import Link from 'next/link';

export default function PendingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Pago Pendiente</h1>
            <p className="text-zinc-500 max-w-md mb-8">
                Tu pago está siendo procesado. Esto puede demorar unos minutos dependiendo del método elegido (como transferencia o Rapipago). Te avisaremos por mail cuando se confirme.
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
