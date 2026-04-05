import Image from 'next/image';
import Link from 'next/link';
import { normalizeStoreImageUrl } from '@/lib/store-image-url';
import {
  getStoreData,
  fetchTiendanubePageById,
  fetchTiendanubeStore,
  pickTiendanubeLocalizedText,
  normalizeTiendanubeLogo,
} from '@/lib/backend';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shop?: string }>;
};

export default async function PaginaInstitucional({ params, searchParams }: Props) {
  const { id } = await params;
  const { shop = '5112334' } = await searchParams;
  const storeLocal = await getStoreData(shop);
  if (!storeLocal?.accessToken) {
    return (
      <main style={{ padding: '48px 24px', fontFamily: 'system-ui' }}>
        <p>Tienda no configurada.</p>
        <Link href="/">Volver al inicio</Link>
      </main>
    );
  }

  const [pageRaw, tnStore] = await Promise.all([
    fetchTiendanubePageById(storeLocal.storeId, storeLocal.accessToken, id),
    fetchTiendanubeStore(storeLocal.storeId, storeLocal.accessToken),
  ]);

  if (!pageRaw) {
    return (
      <main style={{ padding: '48px 24px', fontFamily: 'system-ui' }}>
        <p>Página no encontrada.</p>
        <Link href={`/?shop=${shop}`}>Volver al inicio</Link>
      </main>
    );
  }

  const mainLang = tnStore?.main_language || 'es';
  const titulo = pickTiendanubeLocalizedText(pageRaw.name, mainLang);
  const html = pickTiendanubeLocalizedText(pageRaw.content, mainLang);
  const logoRaw = normalizeTiendanubeLogo(tnStore?.logo) || storeLocal.logo;
  const logo = logoRaw ? normalizeStoreImageUrl(logoRaw) || logoRaw : null;

  return (
    <main style={{ backgroundColor: '#fff', color: '#111', fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      <header
        style={{
          borderBottom: '1px solid #eee',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <Link href={`/?shop=${shop}`} style={{ textDecoration: 'none', color: '#111', fontSize: 13, fontWeight: 600 }}>
          ← Volver
        </Link>
        {logo ? (
          <Link href={`/?shop=${shop}`}>
            <Image src={logo} alt="" width={160} height={32} style={{ maxHeight: 32, width: 'auto', height: 'auto' }} />
          </Link>
        ) : null}
      </header>
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.02em' }}>{titulo}</h1>
        <div
          className="tn-page-content"
          dangerouslySetInnerHTML={{ __html: html }}
          suppressHydrationWarning
        />
      </article>
      <style dangerouslySetInnerHTML={{ __html: `
        .tn-page-content { font-size: 15px; line-height: 1.65; }
        .tn-page-content p { margin: 0 0 1em; }
        .tn-page-content img { max-width: 100%; height: auto; }
        .tn-page-content a { color: #111; text-decoration: underline; }
      `}} />
    </main>
  );
}
