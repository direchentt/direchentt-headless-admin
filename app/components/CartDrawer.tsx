'use client';

import { useStore } from '../context/StoreContext';
import { useCheckout } from '../hooks/useCheckout';
import Link from 'next/link';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { formatPrice, getVariantDisplayPrices } from '@/lib/product-utils';
import { pickStrategicCartUpsells } from '@/lib/cart-suggestions';
import StoreImage from './StoreImage';

interface CartDrawerProps {
  storeId: string;
  products?: any[];
}

function lineFromProduct(product: any): {
  productId: string;
  variantId: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
} | null {
  const v =
    product?.variants?.find((x: any) => (x.stock ?? 0) > 0) || product?.variants?.[0];
  if (!v?.id) return null;
  const productName =
    typeof product.name === 'object'
      ? product.name.es || product.name.en || 'Producto'
      : product.name || 'Producto';
  let variantName = '';
  if (v.attributes) {
    variantName = Object.values(v.attributes).filter(Boolean).join(' / ');
  }
  const { current } = getVariantDisplayPrices(v);
  const productImage = product.images?.[0]?.src || v.image?.src || '';
  return {
    productId: String(product.id),
    variantId: String(v.id),
    name: productName,
    variant: variantName,
    price: current,
    quantity: 1,
    image: productImage,
  };
}

export default function CartDrawer({ storeId, products = [] }: CartDrawerProps) {
  const {
    isCartOpen,
    setCartOpen,
    cart,
    cartCount,
    cartTotal,
    removeFromCart,
    updateQuantity,
    addToCart,
  } = useStore();

  const { createCartAndCheckout, loading: checkoutLoading, error: checkoutError } = useCheckout(storeId);

  const cartProductIds = useMemo(
    () => new Set(cart.map((c) => String(c.productId))),
    [cart]
  );

  const upsells = useMemo(() => {
    if (!products.length || cart.length === 0) return [];
    return pickStrategicCartUpsells(products, cartProductIds, 3);
  }, [products, cart.length, cartProductIds]);

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => setCartOpen(false), [setCartOpen]);

  useEffect(() => {
    if (!isCartOpen) return;

    prevFocusRef.current = document.activeElement as HTMLElement | null;
    const id = window.requestAnimationFrame(() => closeBtnRef.current?.focus());

    const drawer = drawerRef.current;
    const getFocusable = () => {
      if (!drawer) return [];
      return Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = getFocusable();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !drawer?.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('keydown', onKeyDown);
      prevFocusRef.current?.focus?.();
      prevFocusRef.current = null;
    };
  }, [isCartOpen, handleClose]);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    const checkoutItems = cart.map((item) => ({
      variantId: parseInt(item.variantId.toString(), 10),
      quantity: item.quantity,
      productId: parseInt(item.productId.toString(), 10),
      name: item.name,
      price: item.price,
    }));

    try {
      await createCartAndCheckout(checkoutItems);
    } catch (error) {
      console.error('Error en checkout:', error);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      <button
        type="button"
        className="cart-overlay"
        aria-label="Cerrar carrito"
        onClick={handleClose}
      />
      <div
        ref={drawerRef}
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div className="cart-header">
          <h2 id="cart-drawer-title">CARRITO ({cartCount})</h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="cart-close"
            onClick={handleClose}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {checkoutError ? (
          <div className="cart-live-region" role="status" aria-live="polite">
            {checkoutError}
          </div>
        ) : null}

        {cart.length === 0 ? (
          <div className="cart-empty">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" aria-hidden>
              <path d="M3 3h2l.4 2M7 13h10l2-7H6l-1.6-8M7 13L5.4 5M7 13l-1.293 1.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-10 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <p>Tu carrito está vacío</p>
            <button type="button" className="cart-continue" onClick={handleClose}>
              SEGUIR COMPRANDO
            </button>
          </div>
        ) : (
          <div className="cart-with-items">
            <div className="cart-body">
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      {item.image ? (
                        <StoreImage
                          src={item.image}
                          alt={item.name}
                          width={96}
                          height={112}
                          className="cart-line-image"
                          sizes="96px"
                        />
                      ) : (
                        <div className="cart-item-placeholder">Sin imagen</div>
                      )}
                    </div>
                    <div className="cart-item-details">
                      <Link
                        href={`/product/${item.productId}?shop=${storeId}`}
                        className="cart-item-name"
                        onClick={handleClose}
                      >
                        {item.name.toUpperCase()}
                      </Link>
                      {item.variant ? (
                        <p className="cart-item-variant">{item.variant}</p>
                      ) : null}
                      <p className="cart-item-price">{formatPrice(item.price)}</p>

                      <div className="cart-item-quantity" role="group" aria-label={`Cantidad de ${item.name}`}>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1, {
                              storeId,
                              productId: String(item.productId),
                            })
                          }
                          aria-label="Quitar una unidad"
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1, {
                              storeId,
                              productId: String(item.productId),
                            })
                          }
                          aria-label="Agregar una unidad"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() =>
                        removeFromCart(item.id, {
                          storeId,
                          productId: String(item.productId),
                        })
                      }
                      aria-label={`Eliminar ${item.name} del carrito`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {upsells.length > 0 ? (
                <aside className="cart-upsell" aria-label="Productos sugeridos">
                  <div className="cart-upsell-head">
                    <div>
                      <h3 className="cart-upsell-title">Te puede interesar</h3>
                      <p className="cart-upsell-sub">Según tu carrito</p>
                    </div>
                    {upsells.length > 1 ? (
                      <span className="cart-upsell-hint">Deslizá →</span>
                    ) : null}
                  </div>
                  <div className="cart-upsell-scroller" tabIndex={0}>
                    <ul className="cart-upsell-track">
                      {upsells.map((p) => {
                        const img = p.images?.[0]?.src;
                        const name =
                          typeof p.name === 'object'
                            ? p.name.es || p.name.en || 'Producto'
                            : p.name || 'Producto';
                        return (
                          <li key={p.id} className="cart-upsell-card">
                            <Link
                              href={`/product/${p.id}?shop=${encodeURIComponent(storeId)}`}
                              className="cart-upsell-card-media"
                              onClick={handleClose}
                            >
                              {img ? (
                                <StoreImage
                                  src={img}
                                  alt={name}
                                  width={112}
                                  height={128}
                                  className="cart-upsell-card-img"
                                  sizes="112px"
                                />
                              ) : (
                                <div className="cart-upsell-ph" />
                              )}
                            </Link>
                            <Link
                              href={`/product/${p.id}?shop=${encodeURIComponent(storeId)}`}
                              className="cart-upsell-card-name"
                              onClick={handleClose}
                            >
                              {name}
                            </Link>
                            <button
                              type="button"
                              className="cart-upsell-card-add"
                              onClick={() => {
                                const line = lineFromProduct(p);
                                if (!line) return;
                                const cat0 = p.categories?.[0];
                                const categoryId =
                                  typeof cat0?.id === 'number' ? cat0.id : undefined;
                                addToCart(line, {
                                  storeId,
                                  ...(categoryId != null ? { categoryId } : {}),
                                });
                              }}
                            >
                              Añadir
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </aside>
              ) : null}
            </div>

            <div className="cart-footer">
              <div className="cart-subtotal">
                <span>SUBTOTAL</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <p className="cart-shipping">Envío calculado en el checkout</p>

              <button
                type="button"
                className="cart-checkout"
                onClick={() => void handleCheckout()}
                disabled={checkoutLoading || cart.length === 0}
              >
                {checkoutLoading ? 'PROCESANDO...' : 'FINALIZAR COMPRA'}
              </button>

              <button type="button" className="cart-continue-shopping" onClick={handleClose}>
                SEGUIR COMPRANDO
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9998;
          animation: fadeIn 0.2s ease;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .cart-overlay:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
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
          outline: none;
        }
        .cart-drawer:focus-visible {
          outline: none;
        }
        .cart-live-region {
          padding: 10px 20px;
          font-size: 13px;
          color: #b00020;
          background: #fff5f5;
          border-bottom: 1px solid #f0f0f0;
        }
        .cart-line-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
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
        .cart-close:focus-visible {
          outline: 2px solid #000;
          outline-offset: 2px;
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
        .cart-continue:focus-visible,
        .cart-checkout:focus-visible,
        .cart-continue-shopping:focus-visible,
        .cart-item-quantity button:focus-visible {
          outline: 2px solid #000;
          outline-offset: 2px;
        }
        .cart-with-items {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .cart-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        .cart-items {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 14px 16px 12px;
          min-height: 0;
          -webkit-overflow-scrolling: touch;
        }
        .cart-upsell {
          flex-shrink: 0;
          padding: 10px 0 12px;
          border-top: 1px solid #e8e8e8;
          background: linear-gradient(180deg, #fbfbfb 0%, #f3f3f3 100%);
        }
        .cart-upsell-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          padding: 0 16px 8px;
        }
        .cart-upsell-title {
          margin: 0;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #111;
        }
        .cart-upsell-sub {
          margin: 3px 0 0 0;
          font-size: 10px;
          color: #888;
          line-height: 1.2;
        }
        .cart-upsell-hint {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #aaa;
          white-space: nowrap;
        }
        .cart-upsell-scroller {
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          scrollbar-width: thin;
          padding: 0 16px 4px;
          -webkit-overflow-scrolling: touch;
        }
        .cart-upsell-scroller:focus-visible {
          outline: 2px solid #000;
          outline-offset: 2px;
        }
        .cart-upsell-track {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          gap: 10px;
          width: max-content;
        }
        .cart-upsell-scroller::-webkit-scrollbar {
          height: 5px;
        }
        .cart-upsell-scroller::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .cart-upsell-card {
          flex: 0 0 118px;
          width: 118px;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          padding: 8px 8px 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .cart-upsell-card-media {
          display: block;
          width: 100%;
          aspect-ratio: 3 / 3.5;
          background: #eee;
          border-radius: 6px;
          overflow: hidden;
        }
        .cart-upsell-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .cart-upsell-ph {
          width: 100%;
          height: 100%;
          min-height: 96px;
          background: #e8e8e8;
        }
        .cart-upsell-card-name {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          color: #111;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.8em;
        }
        .cart-upsell-card-name:hover {
          text-decoration: underline;
        }
        .cart-upsell-card-add {
          margin-top: auto;
          width: 100%;
          padding: 7px 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid #111;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
        }
        .cart-upsell-card-add:hover {
          background: #111;
          color: #fff;
        }
        .cart-upsell-card-add:focus-visible {
          outline: 2px solid #000;
          outline-offset: 2px;
        }
        .cart-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          margin-bottom: 10px;
          position: relative;
          background: #fff;
          border: 1px solid #e6e6e6;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .cart-item:last-child {
          margin-bottom: 0;
        }
        .cart-item-image {
          width: 96px;
          height: 112px;
          background: #f0f0f0;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 8px;
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
          font-weight: 800;
          letter-spacing: 0.08em;
          text-decoration: none;
          color: #000;
          line-height: 1.35;
          padding-right: 22px;
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
          font-size: 13px;
          font-weight: 700;
          margin: 6px 0 8px 0;
          color: #111;
        }
        .cart-item-quantity {
          display: inline-flex;
          align-items: stretch;
          margin-top: auto;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        .cart-item-quantity button {
          width: 36px;
          min-height: 34px;
          border: none;
          background: #fff;
          color: #111;
          cursor: pointer;
          font-size: 18px;
          font-weight: 600;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cart-item-quantity button:first-child {
          border-right: 1px solid #1a1a1a;
        }
        .cart-item-quantity button:last-child {
          border-left: 1px solid #1a1a1a;
        }
        .cart-item-quantity button:hover {
          background: #111;
          color: #fff;
        }
        .cart-item-quantity span {
          min-width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          background: #f5f5f5;
          color: #111;
        }
        .cart-item-remove {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 14px;
          cursor: pointer;
          color: #999;
        }
        .cart-item-remove:hover {
          color: #000;
        }
        .cart-item-remove:focus-visible {
          outline: 2px solid #000;
          outline-offset: 2px;
        }
        .cart-footer {
          flex-shrink: 0;
          padding: 16px 18px 20px;
          border-top: 1px solid #e8e8e8;
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
