'use client';

import dynamic from 'next/dynamic';

const SearchModal = dynamic(() => import('./SearchModal'), { ssr: false });
const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });

interface ModalsWrapperProps {
  products: any[];
  storeId: string;
}

export default function ModalsWrapper({ products, storeId }: ModalsWrapperProps) {
  return (
    <>
      <SearchModal products={products} storeId={storeId} />
      <AuthModal />
      <CartDrawer storeId={storeId} />
    </>
  );
}
