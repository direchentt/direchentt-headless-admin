'use client';

import dynamic from 'next/dynamic';

const SearchModal = dynamic(() => import('./SearchModal'), { ssr: false });
const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });

interface ModalsWrapperProps {
  products: any[];
  storeId: string | number;
}

export default function ModalsWrapper({ products, storeId }: ModalsWrapperProps) {
  const sid = String(storeId);
  return (
    <>
      <SearchModal products={products} storeId={sid} />
      <AuthModal defaultShopId={sid} />
      <CartDrawer storeId={sid} products={products} />
    </>
  );
}
