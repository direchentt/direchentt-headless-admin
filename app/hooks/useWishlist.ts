'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { queueStorefrontSignals } from '@/lib/storefront-signals-client';
import { readLocalWishlistIds, writeLocalWishlistIds } from '@/lib/wishlist-local';

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

async function fetchServerIds(storeId: string, token: string): Promise<{ ids: number[]; status: number }> {
  const r = await fetch(
    `/api/wishlist?shop=${encodeURIComponent(storeId)}&idsOnly=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  let ids: number[] = [];
  try {
    const data = (await r.json()) as { ids?: number[] };
    if (Array.isArray(data.ids)) ids = data.ids;
  } catch {
    /* ignore */
  }
  return { ids, status: r.status };
}

export function useWishlist(storeId: string) {
  const { sessionToken, logout } = useStore();
  const [ids, setIds] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

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

  const mergeFromSources = useCallback(
    async (token: string | null) => {
      const local = readLocalWishlistIds(storeId);
      if (!token) {
        setIds(new Set(local));
        return;
      }
      setLoading(true);
      try {
        let res = await fetchServerIds(storeId, token);
        if (res.status === 401) {
          logout();
          setIds(new Set(local));
          setLastError('Sesión vencida. Iniciá sesión de nuevo.');
          return;
        }
        if (res.status !== 200) {
          setIds(new Set(local));
          setLastError('No se pudo leer favoritos del servidor.');
          return;
        }

        const serverSet = new Set(res.ids);
        let pushed = false;
        for (const id of local) {
          if (!serverSet.has(id)) {
            const pr = await fetch('/api/wishlist', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ shop: storeId, productId: id, action: 'add' }),
            });
            if (pr.ok) pushed = true;
          }
        }
        if (pushed) {
          const res2 = await fetchServerIds(storeId, token);
          if (res2.status === 200) res = res2;
        }
        if (res.status === 200) {
          const merged = [...new Set([...local, ...res.ids])];
          setIds(new Set(merged));
          writeLocalWishlistIds(storeId, merged);
        } else {
          setIds(new Set(local));
        }
      } finally {
        setLoading(false);
      }
    },
    [storeId, logout]
  );

  useEffect(() => {
    setLastError(null);
    void mergeFromSources(sessionToken);
  }, [storeId, sessionToken, mergeFromSources]);

  const refresh = useCallback(async () => {
    await mergeFromSources(sessionToken);
  }, [mergeFromSources, sessionToken]);

  const isWishlisted = useCallback(
    (productId: number) => ids.has(productId),
    [ids]
  );

  const toggle = useCallback(
    async (productId: number): Promise<boolean> => {
      setLastError(null);
      const before = new Set(ids);
      const inList = before.has(productId);
      const action = inList ? 'remove' : 'add';
      const after = new Set(before);
      if (inList) after.delete(productId);
      else after.add(productId);
      setIds(after);
      writeLocalWishlistIds(storeId, [...after]);

      if (!sessionToken) {
        dispatchWishlistChanged(storeId, productId, !inList);
        return true;
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
          action,
        }),
      });

      if (!r.ok) {
        setIds(before);
        writeLocalWishlistIds(storeId, [...before]);
        if (r.status === 401) {
          logout();
          setLastError('Sesión vencida. Iniciá sesión de nuevo.');
        } else {
          let msg = 'No se pudo guardar en el servidor.';
          try {
            const j = (await r.json()) as { error?: string };
            if (j.error) msg = j.error;
          } catch {
            /* ignore */
          }
          setLastError(msg);
        }
        return false;
      }

      const data = (await r.json()) as { inWishlist?: boolean };
      const inWishlist = data.inWishlist === true;
      const aligned = new Set(before);
      if (inWishlist) aligned.add(productId);
      else aligned.delete(productId);
      setIds(aligned);
      writeLocalWishlistIds(storeId, [...aligned]);
      dispatchWishlistChanged(storeId, productId, inWishlist);
      if (inWishlist) {
        queueStorefrontSignals(storeId, [{ type: 'wishlist_add', payload: { productId } }]);
      }
      return true;
    },
    [ids, sessionToken, storeId, logout]
  );

  const count = useMemo(() => ids.size, [ids]);

  return { ids, loading, refresh, isWishlisted, toggle, count, lastError };
}
