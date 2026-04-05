'use client';

import Image from 'next/image';
import { useState } from 'react';
import ExpressCheckoutModal from './ExpressCheckoutModal';
import type { ExpressCheckoutLineItem } from './ExpressCheckoutModal';

export default function MercadoPagoButton({
  items,
  storeId,
  summary,
}: {
  items: ExpressCheckoutLineItem[];
  storeId: string;
  summary?: string;
}) {
  const [open, setOpen] = useState(false);

  const mpItems: ExpressCheckoutLineItem[] = (items || []).map((item: any) => ({
    variantId: item.variantId ?? item.id,
    id: item.id,
    name: String(item.name || 'Producto'),
    price: item.price,
    quantity: item.quantity ?? 1,
  }));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!mpItems.length}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#009EE3] hover:bg-[#0089c7] text-white rounded-full transition-all font-bold shadow-sm disabled:opacity-50"
      >
        <Image
          src="https://http2.mlstatic.com/frontend-assets/marketplace-web/mkt-web-navigation/current/mp-logo.svg"
          alt="Mercado Pago"
          width={120}
          height={32}
          className="h-6 w-auto invert brightness-0"
          unoptimized
        />
        Pagar con Mercado Pago
      </button>

      <ExpressCheckoutModal
        open={open}
        onClose={() => setOpen(false)}
        storeId={storeId}
        items={mpItems}
        summary={summary}
      />
    </>
  );
}
