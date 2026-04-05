'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';

const WISHLIST_EVENT = 'direchentt-wishlist-changed';

export function dispatchWishlistChanged(
  storeId: string,
  productId: number,
  inWishlist: boolean
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(WISHLIST_EVENT, {
      detail: { storeId, productId, inWishlist },
    })
  );
}

export function useWishlist(storeId: string) {
  const { sessionToken, isLoggedIn, setAuthOpen } = useStore();
  const [ids, setIds] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent<{
        storeId: string;
        productId: number;
        inWishlist: boolean;
      }>;
      const d = ce.detail;
      if (!d || d.storeId !== storeId) return;
      setIds((prev) => {
        const next = new Set(prev);
        if (d.inWishlist) next.add(d.productId);
        else next.delete(d.productId);
        return next;
      });
    };
    window.addEventListener(WISHLIST_EVENT, h as EventListener);
    return () => window.removeEventListener(WISHLIST_EVENT, h as EventListener);
  }, [storeId]);

  const refresh = useCallback(async () => {
    if (!sessionToken || !storeId) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `/api/wishlist?shop=${encodeURIComponent(storeId)}&idsOnly=1`,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      if (!r.ok) {
        setIds(new Set());
        return;
      }
      const data = (await r.json()) as { ids?: number[] };
      setIds(new Set(Array.isArray(data.ids) ? data.ids : []));
    } finally {
      setLoading(false);
    }
  }, [sessionToken, storeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isWishlisted = useCallback(
    (productId: number) => ids.has(productId),
    [ids]
  );

  const toggle = useCallback(
    async (productId: number): Promise<boolean> => {
      if (!isLoggedIn || !sessionToken) {
        setAuthOpen(true);
        return false;
      }
      const r = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          shop: storeId,
          productId,
          action: 'toggle',
        }),
      });
      if (!r.ok) return false;
      const data = (await r.json()) as { inWishlist?: boolean };
      const inWishlist = data.inWishlist === true;
      setIds((prev) => {
        const next = new Set(prev);
        if (inWishlist) next.add(productId);
        else next.delete(productId);
        return next;
      });
      dispatchWishlistChanged(storeId, productId, inWishlist);
      return true;
    },
    [isLoggedIn, sessionToken, storeId, setAuthOpen]
  );

  const count = useMemo(() => ids.size, [ids]);

  return { ids, loading, refresh, isWishlisted, toggle, count };
}
