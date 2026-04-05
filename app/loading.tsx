export default function Loading() {
  const year = new Date().getFullYear();

  return (
    <div className="store-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="store-loading-shell">
        <div className="store-loading-brand">
          <span className="store-loading-mark" aria-hidden />
          <p className="store-loading-story">
            Curamos cada detalle de tu vitrina digital. Dale un respiro a la pantalla: estamos
            hilando catálogo, imágenes y precios para que todo respire como en tienda propia.
          </p>
        </div>

        <div className="store-loading-skeletons" aria-hidden>
          <div className="store-skel store-skel--hero" />
          <div className="store-skel-grid">
            <div className="store-skel store-skel--card" />
            <div className="store-skel store-skel--card" />
            <div className="store-skel store-skel--card" />
            <div className="store-skel store-skel--card" />
          </div>
        </div>

        <footer className="store-loading-footer">
          <p className="store-loading-copy">
            © {year} Direchentt Studio — experiencias de compra con narrativa, hechas para durar.
          </p>
        </footer>
      </div>
    </div>
  );
}
