import './globals.css';
import { StoreProvider } from './context/StoreContext';
import NewsletterPopup from './components/NewsletterPopup';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ margin: 0, backgroundColor: '#fff' }} suppressHydrationWarning>
        <StoreProvider>
          {children}
          <NewsletterPopup />
        </StoreProvider>
      </body>
    </html>
  );
}