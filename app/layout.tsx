import './globals.css';
import { StoreProvider } from './context/StoreContext';
import NewsletterPopupClientLazy from './components/NewsletterPopupClientLazy';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ margin: 0, backgroundColor: '#fff' }} suppressHydrationWarning>
        <StoreProvider>
          <a href="#site-main" className="skip-to-content">
            Saltar al contenido principal
          </a>
          <div id="site-main" tabIndex={-1} className="site-main-outline">
            {children}
          </div>
          <NewsletterPopupClientLazy />
        </StoreProvider>
      </body>
    </html>
  );
}