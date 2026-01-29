import './globals.css';
import { StoreProvider } from './context/StoreContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, backgroundColor: '#fff' }}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}