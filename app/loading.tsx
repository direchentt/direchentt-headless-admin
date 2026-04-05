export default function Loading() {
  return (
    <div className="store-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="store-loading-inner">
        <div className="store-loading-bar" aria-hidden />
        <p className="store-loading-text">Cargando tienda…</p>
      </div>
    </div>
  );
}
