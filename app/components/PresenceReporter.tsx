'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getOrCreateVisitorId } from '@/lib/storefront-signals-client';

function inferPageMeta(pathname: string): {
  pageType: string;
  productId?: number;
  categoryId?: number;
} {
  const p = pathname || '/';
  const mProd = /^\/product\/(\d+)/.exec(p);
  if (mProd) {
    const id = parseInt(mProd[1], 10);
    return Number.isFinite(id) ? { pageType: 'product', productId: id } : { pageType: 'other' };
  }
  const mCat = /^\/categoria\/(\d+)/.exec(p);
  if (mCat) {
    const id = parseInt(mCat[1], 10);
    return Number.isFinite(id) ? { pageType: 'category', categoryId: id } : { pageType: 'other' };
  }
  if (p.startsWith('/collections')) return { pageType: 'collections' };
  if (p === '/' || p === '') return { pageType: 'home' };
  return { pageType: 'other' };
}

export default function PresenceReporter({ storeId }: { storeId: string | number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sid = String(storeId).trim();

  useEffect(() => {
    if (!sid) return;

    const tick = () => {
      const visitorId = getOrCreateVisitorId();
      if (!visitorId) return;

      const qs = searchParams?.toString();
      const path = `${pathname || '/'}${qs ? `?${qs}` : ''}`;
      const meta = inferPageMeta(pathname || '/');
      const deviceHint =
        typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : undefined;

      void fetch('/api/storefront/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: sid,
          visitorId,
          path: path.slice(0, 512),
          pageType: meta.pageType,
          productId: meta.productId,
          categoryId: meta.categoryId,
          deviceHint,
        }),
      }).catch(() => {});
    };

    tick();
    const t = setInterval(tick, 12000);
    return () => clearInterval(t);
  }, [pathname, searchParams, sid]);

  return null;
}
