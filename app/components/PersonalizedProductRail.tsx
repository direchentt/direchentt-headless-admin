'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductGrid from './ProductGrid';
import { getOrCreateVisitorId } from '@/lib/storefront-signals-client';

type ProfileHints = {
  recentProductIds: number[];
  cartAffinityIds: number[];
  topCategoryIds: number[];
};

function scoreProduct(p: any, profile: ProfileHints): number {
  const id = Number(p.id);
  if (!Number.isFinite(id)) return 0;
  let s = 0;
  if (profile.recentProductIds.includes(id)) s += 6;
  if (profile.cartAffinityIds.includes(id)) s += 10;
  const cats = p.categories || [];
  for (const c of cats) {
    const cid = typeof c.id === 'number' ? c.id : parseInt(String(c.id), 10);
    if (Number.isFinite(cid) && profile.topCategoryIds.includes(cid)) {
      s += 4;
      break;
    }
  }
  return s;
}

export default function PersonalizedProductRail({
  products,
  storeId,
  title = 'PARA VOS',
}: {
  products: any[];
  storeId: string;
  title?: string;
}) {
  const [profile, setProfile] = useState<ProfileHints | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const vid = getOrCreateVisitorId();
    if (!vid || !storeId) {
      setReady(true);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/storefront/profile?shop=${encodeURIComponent(storeId)}&visitorId=${encodeURIComponent(vid)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setProfile({
          recentProductIds: Array.isArray(data.recentProductIds) ? data.recentProductIds : [],
          cartAffinityIds: Array.isArray(data.cartAffinityIds) ? data.cartAffinityIds : [],
          topCategoryIds: Array.isArray(data.topCategoryIds) ? data.topCategoryIds : [],
        });
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const picked = useMemo(() => {
    if (!profile || !products.length) return [];
    const scored = products
      .map((p) => ({ p, s: scoreProduct(p, profile) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    const seen = new Set<number>();
    const out: any[] = [];
    for (const { p } of scored) {
      const id = Number(p.id);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(p);
      if (out.length >= 12) break;
    }
    return out;
  }, [products, profile]);

  if (!ready || picked.length === 0) return null;

  return (
    <section style={{ padding: '80px 0', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <h2
          style={{
            fontSize: '12px',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '50px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h2>
        <ProductGrid products={picked} storeId={storeId} />
      </div>
    </section>
  );
}
