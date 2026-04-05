import { Suspense } from 'react';
import CheckoutSuccessContent from './CheckoutSuccessContent';

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            background: '#f4f4f5',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid #e4e4e7',
              borderTopColor: '#18181b',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <p style={{ fontSize: 14, color: '#52525b' }}>Cargando confirmación…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
