'use client';

import { useStore } from '../context/StoreContext';
import Link from 'next/link';
import { useEffect } from 'react';

interface CartDrawerProps {
  storeId: string;
}

export default function CartDrawer({ storeId }: CartDrawerProps) {
  const { 
    isCartOpen, 
    setCartOpen, 
    cart, 
    cartCount, 
    cartTotal, 
    removeFromCart, 
    updateQuantity,
    clearCart 
  } = useStore();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setCartOpen]);

  // Bloquear scroll cuando está abierto
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={() => setCartOpen(false)} />
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>CARRITO ({cartCount})</h2>
          <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
              <path d="M3 3h2l.4 2M7 13h10l2-7H6l-1.6-8M7 13L5.4 5M7 13l-1.293 1.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-10 0a2 2 0 100 4 2 2 0 000-4z"/>
            </svg>
            <p>Tu carrito está vacío</p>
            <button className="cart-continue" onClick={() => setCartOpen(false)}>
              SEGUIR COMPRANDO
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="cart-item-placeholder">Sin imagen</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <Link 
                      href={`/product/${item.productId}?shop=${storeId}`} 
                      className="cart-item-name"
                      onClick={() => setCartOpen(false)}
                    >
                      {item.name.toUpperCase()}
                    </Link>
                    {item.variant && <p className="cart-item-variant">{item.variant}</p>}
                    <p className="cart-item-price">$ {item.price}</p>
                    
                    <div className="cart-item-quantity">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button 
                    className="cart-item-remove" 
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-subtotal">
                <span>SUBTOTAL</span>
                <span>$ {cartTotal.toLocaleString()}</span>
              </div>
              <p className="cart-shipping">Envío calculado en el checkout</p>
              
              <button className="cart-checkout">
                FINALIZAR COMPRA
              </button>
              
              <button className="cart-continue-shopping" onClick={() => setCartOpen(false)}>
                SEGUIR COMPRANDO
              </button>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9998;
          animation: fadeIn 0.2s ease;
        }
        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 420px;
          background: #fff;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s ease;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .cart-header h2 {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
          margin: 0;
        }
        .cart-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
        }
        .cart-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 40px;
        }
        .cart-empty p {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        .cart-continue {
          background: #000;
          color: #fff;
          border: none;
          padding: 15px 30px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          cursor: pointer;
        }
        .cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .cart-item {
          display: flex;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #f0f0f0;
          position: relative;
        }
        .cart-item-image {
          width: 100px;
          height: 120px;
          background: #f5f5f5;
          flex-shrink: 0;
        }
        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cart-item-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #999;
        }
        .cart-item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .cart-item-name {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-decoration: none;
          color: #000;
        }
        .cart-item-name:hover {
          text-decoration: underline;
        }
        .cart-item-variant {
          font-size: 11px;
          color: #666;
          margin: 0;
        }
        .cart-item-price {
          font-size: 12px;
          font-weight: 600;
          margin: 5px 0;
        }
        .cart-item-quantity {
          display: flex;
          align-items: center;
          gap: 0;
          margin-top: auto;
        }
        .cart-item-quantity button {
          width: 30px;
          height: 30px;
          border: 1px solid #e0e0e0;
          background: #fff;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cart-item-quantity button:hover {
          background: #f5f5f5;
        }
        .cart-item-quantity span {
          width: 40px;
          height: 30px;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .cart-item-remove {
          position: absolute;
          top: 15px;
          right: 0;
          background: none;
          border: none;
          font-size: 14px;
          cursor: pointer;
          color: #999;
        }
        .cart-item-remove:hover {
          color: #000;
        }
        .cart-footer {
          padding: 20px;
          border-top: 1px solid #f0f0f0;
          background: #fafafa;
        }
        .cart-subtotal {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .cart-shipping {
          font-size: 12px;
          color: #666;
          margin: 0 0 20px 0;
        }
        .cart-checkout {
          width: 100%;
          background: #000;
          color: #fff;
          border: none;
          padding: 18px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          cursor: pointer;
          margin-bottom: 10px;
          transition: background 0.2s;
        }
        .cart-checkout:hover {
          background: #333;
        }
        .cart-continue-shopping {
          width: 100%;
          background: #fff;
          color: #000;
          border: 1px solid #000;
          padding: 15px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cart-continue-shopping:hover {
          background: #000;
          color: #fff;
        }
      `}} />
    </>
  );
}
