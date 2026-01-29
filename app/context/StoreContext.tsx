'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// =================== TIPOS ===================
interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface StoreContextType {
  // Cart
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Auth
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  
  // UI State
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isAuthOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  isSearching: boolean;
  performSearch: (query: string, products: any[]) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// =================== PROVIDER ===================
export function StoreProvider({ children }: { children: ReactNode }) {
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  // UI State
  const [isCartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('direchentt_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
    
    const savedUser = localStorage.getItem('direchentt_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('direchentt_cart', JSON.stringify(cart));
  }, [cart]);

  // =================== CART FUNCTIONS ===================
  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const id = `${item.productId}-${item.variantId}`;
    
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variantId === item.variantId);
      
      if (existing) {
        return prev.map(i => 
          i.id === existing.id 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      
      return [...prev, { ...item, id }];
    });
    
    // Open cart drawer when adding
    setCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // =================== AUTH FUNCTIONS ===================
  const login = async (email: string, password: string, name?: string): Promise<boolean> => {
    // Simulación de login - en producción esto llamaría a TiendaNube API
    try {
      // Por ahora, aceptamos cualquier email/password para demo
      const mockUser: User = {
        id: Date.now().toString(),
        email: email,
        name: name || email.split('@')[0]
      };
      
      setUser(mockUser);
      localStorage.setItem('direchentt_user', JSON.stringify(mockUser));
      setAuthOpen(false);
      return true;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('direchentt_user');
  };

  // =================== SEARCH FUNCTIONS ===================
  const performSearch = (query: string, products: any[]) => {
    setIsSearching(true);
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    const results = products.filter((product: any) => {
      const name = typeof product.name === 'object' 
        ? (product.name.es || product.name.en || '')
        : (product.name || '');
      
      const description = typeof product.description === 'object'
        ? (product.description.es || product.description.en || '')
        : (product.description || '');
      
      return name.toLowerCase().includes(normalizedQuery) ||
             description.toLowerCase().includes(normalizedQuery);
    });

    setSearchResults(results.slice(0, 10)); // Max 10 results
    setIsSearching(false);
  };

  const value: StoreContextType = {
    // Cart
    cart,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    
    // Auth
    user,
    isLoggedIn: !!user,
    login,
    logout,
    
    // UI State
    isCartOpen,
    isSearchOpen,
    isAuthOpen,
    setCartOpen,
    setSearchOpen,
    setAuthOpen,
    
    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    performSearch,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

// =================== HOOK ===================
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
