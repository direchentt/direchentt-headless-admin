'use client';

import SearchModal from './SearchModal';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';

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
