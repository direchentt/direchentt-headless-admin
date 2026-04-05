import Link from 'next/link';

/**
 * Sustituye la pantalla en blanco cuando no hay tienda en Mongo o falla la conexión.
 */
export default function StoreUnavailable({ shopId }: { shopId: string }) {
  return (
    <main
      className="store-unavailable"
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.25rem',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#111',
        background: '#fafafa',
      }}
    >
      <div
        style={{
          maxWidth: '26rem',
          width: '100%',
          background: '#fff',
          border: '1px solid #eaeaea',
          borderRadius: '12px',
          padding: '2rem 1.5rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#888',
            margin: '0 0 12px',
          }}
        >
          Tienda no disponible
        </p>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 12px', lineHeight: 1.3 }}>
          No se pudo cargar la tienda
        </h1>
        <p style={{ margin: '0 0 14px', fontSize: '14px', lineHeight: 1.6, color: '#444' }}>
          No hay datos para la tienda <strong>{shopId}</strong> o la base no respondió. Revisá la
          configuración de MongoDB y el parámetro <code style={{ fontSize: '0.85em' }}>?shop=</code>.
        </p>
        <p style={{ margin: '0 0 24px', fontSize: '13px', lineHeight: 1.55, color: '#666' }}>
          La app busca la colección <code style={{ fontSize: '0.85em' }}>stores</code> en{' '}
          <code style={{ fontSize: '0.85em' }}>direchentt-headless-admin</code> y, si no hay documento,
          en <code style={{ fontSize: '0.85em' }}>AppRegaloDB</code>.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '44px',
            padding: '0 22px',
            background: '#111',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textDecoration: 'none',
            borderRadius: '8px',
            transition: 'background 0.2s',
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
