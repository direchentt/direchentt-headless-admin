'use client';

import { useState, useEffect } from 'react';
import SearchModal from './SearchModal';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';
import NewsletterPopup from './NewsletterPopup';

interface ModalsWrapperProps {
  products: any[];
  storeId: string;
}

export default function ModalsWrapper({ products, storeId }: ModalsWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <SearchModal products={products} storeId={storeId} />
      <AuthModal />
      <CartDrawer storeId={storeId} />
      <NewsletterPopup />
    </>
  );
}
