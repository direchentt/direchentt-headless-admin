/**
 * Sustituye la pantalla en blanco cuando no hay tienda en Mongo o falla la conexión.
 */
export default function StoreUnavailable({ shopId }: { shopId: string }) {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#1a1a1a',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
        No se pudo cargar la tienda
      </h1>
      <p style={{ margin: '0 0 0.5rem', textAlign: 'center', maxWidth: '28rem', lineHeight: 1.5 }}>
        No hay datos para la tienda <strong>{shopId}</strong> o MongoDB no respondió. La app busca la
        colección <code style={{ fontSize: '0.9em' }}>stores</code> en{' '}
        <code style={{ fontSize: '0.9em' }}>direchentt-headless-admin</code> y, si no hay documento, en{' '}
        <code style={{ fontSize: '0.9em' }}>AppRegaloDB</code>.
      </p>
      <p style={{ margin: 0, textAlign: 'center', maxWidth: '28rem', lineHeight: 1.5, fontSize: '0.9rem', color: '#555' }}>
        Revisa <code style={{ fontSize: '0.85em' }}>MONGODB_URI</code> en Vercel, que el OAuth haya
        guardado el token, y abre la URL con <code style={{ fontSize: '0.85em' }}>?shop=TU_ID</code>{' '}
        si no usas el ID por defecto.
      </p>
    </main>
  );
}
