export default function CollectionsLoading() {
  const year = new Date().getFullYear();

  return (
    <main className="collections-loading-page" role="status" aria-live="polite" aria-busy="true">
      <section className="collections-loading-hero" aria-hidden>
        <div className="collections-loading-hero-inner">
          <div className="store-skel store-skel--crumb" />
          <div className="store-skel store-skel--title" />
          <div className="store-skel store-skel--lead" />
        </div>
      </section>

      <div className="collections-loading-body">
        <div className="collections-loading-editorial">
          <div className="collections-loading-banner store-skel" />
          <div className="collections-loading-grid">
            <div className="collections-loading-cell store-skel" />
            <div className="collections-loading-cell store-skel" />
            <div className="collections-loading-cell store-skel" />
            <div className="collections-loading-cell store-skel" />
          </div>
        </div>

        <p className="collections-loading-story">
          Reordenamos piezas, luces y texturas para que tu colección cuente una historia coherente.
          Casi listo.
        </p>
        <p className="collections-loading-copy">© {year} Direchentt Studio</p>
      </div>
    </main>
  );
}
