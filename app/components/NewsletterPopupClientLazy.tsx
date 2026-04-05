'use client';

import dynamic from 'next/dynamic';

const NewsletterPopup = dynamic(() => import('./NewsletterPopup'), {
  ssr: false,
  loading: () => null,
});

export default function NewsletterPopupClientLazy() {
  return <NewsletterPopup />;
}
