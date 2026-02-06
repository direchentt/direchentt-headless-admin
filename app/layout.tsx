import './globals.css';
import { StoreProvider } from './context/StoreContext';
import EmailPopupWrapper from './components/EmailPopupWrapper';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ margin: 0, backgroundColor: '#fff' }} suppressHydrationWarning>
        <StoreProvider>
          {children}
          <EmailPopupWrapper />
        </StoreProvider>
      </body>
    </html>
  );
}