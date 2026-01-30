'use client';

import dynamic from 'next/dynamic';

// Carga dinámica del VariantSelector, deshabilitando el renderizado en servidor (SSR)
const VariantSelector = dynamic(() => import('./VariantSelector'), {
  ssr: false,
  // Muestra un estado de carga mientras el componente se carga en el cliente
  loading: () => <p>Cargando opciones...</p>, 
});

interface ProductActionsProps {
  product: any;
  storeId: string;
  domain: string;
  onVariantSelect?: (variantName: string) => void;
}

// Este componente simplemente envuelve al VariantSelector para controlar cómo se carga.
export default function ProductActions({ product, storeId, domain, onVariantSelect }: ProductActionsProps) {
  return <VariantSelector product={product} storeId={storeId} domain={domain} onVariantSelect={onVariantSelect} />;
}
