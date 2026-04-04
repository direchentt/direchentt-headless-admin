'use client';

import { useState } from 'react';
import ProductGrid from './ProductGrid';

interface CategoryTabsProps {
  newProducts: any[];
  bestSellers: any[];
  backInStock: any[];
  storeId: string | number;
}

export default function CategoryTabs({
  newProducts,
  bestSellers,
  backInStock,
  storeId
}: CategoryTabsProps) {
  const [activeTab, setActiveTab] = useState('new');

  const tabs = [
    { id: 'new', label: 'Novedades', products: newProducts },
    { id: 'bestsellers', label: 'Best Sellers', products: bestSellers },
    { id: 'backinstock', label: 'Back in Stock', products: backInStock }
  ];

  const activeProducts = tabs.find(t => t.id === activeTab)?.products || newProducts;

  return (
    <div>
      {/* TAB BUTTONS */}
      <div style={{
        display: 'flex',
        gap: '40px',
        marginBottom: '50px',
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '800' : '400',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === tab.id ? '#000' : '#999',
              paddingBottom: '20px',
              borderBottom: activeTab === tab.id ? '2px solid #000' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <ProductGrid products={activeProducts.slice(0, 8)} storeId={storeId} />

      {/* VIEW ALL BUTTON */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button style={{
          padding: '12px 40px',
          border: '1px solid #000',
          background: '#fff',
          color: '#000',
          fontSize: '12px',
          fontWeight: '800',
          letterSpacing: '2px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = '#000';
          (e.target as HTMLButtonElement).style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = '#fff';
          (e.target as HTMLButtonElement).style.color = '#000';
        }}
        >
          Ver Todo
        </button>
      </div>
    </div>
  );
}
