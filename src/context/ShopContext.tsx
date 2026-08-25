import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, LookbookLook, Currency, UserProfile } from '../types';
import { PRODUCTS } from '../data/products';

interface ShopContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, colorName?: string, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, colorName: string, size: string) => void;
  updateQuantity: (productId: string, colorName: string, size: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;

  // Modals & Drawers
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  
  activeLook: LookbookLook | null;
  setActiveLook: (look: LookbookLook | null) => void;
  
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  
  isStoryOpen: boolean;
  setIsStoryOpen: (open: boolean) => void;
  
  isSizeGuideOpen: boolean;
  setIsSizeGuideOpen: (open: boolean) => void;

  isCraftsmanshipOpen: boolean;
  setIsCraftsmanshipOpen: (open: boolean) => void;

  isConciergeOpen: boolean;
  setIsConciergeOpen: (open: boolean) => void;

  // Auth / Account Portal
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  user: UserProfile | null;
  login: (email: string, password?: string, firstName?: string, lastName?: string) => void;
  logout: () => void;

  // Currency
  currency: Currency;
  setCurrency: (currency: Currency) => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('piercyn_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('piercyn_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currency, setCurrency] = useState<Currency>('NGN');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeLook, setActiveLook] = useState<LookbookLook | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCraftsmanshipOpen, setIsCraftsmanshipOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('piercyn_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('piercyn_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('piercyn_user');
      }
    } catch {
      // storage unavailable
    }
  }, [user]);

  const login = (email: string, _password?: string, firstName?: string, lastName?: string) => {
    const fName = firstName || email.split('@')[0];
    const lName = lastName || 'Client';
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      firstName: fName.charAt(0).toUpperCase() + fName.slice(1),
      lastName: lName.charAt(0).toUpperCase() + lName.slice(1),
      email: email.toLowerCase(),
      city: 'Victoria Island, Lagos',
      ordersCount: 3
    };
    setUser(newUser);
    showToast(`Welcome back to PIERCYN, ${newUser.firstName}`);
  };

  const logout = () => {
    setUser(null);
    showToast('Signed out of your PIERCYN account');
  };

  useEffect(() => {
    try {
      localStorage.setItem('piercyn_cart', JSON.stringify(cart));
    } catch {
      // storage unavailable
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('piercyn_wishlist', JSON.stringify(wishlist));
    } catch {
      // storage unavailable
    }
  }, [wishlist]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const addToCart = (product: Product, colorName?: string, size?: string, quantity: number = 1) => {
    const selectedColor = colorName || product.colors[0]?.name || 'Default';
    const selectedSize = size || product.sizes[0] || 'M';

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { product, selectedColor, selectedSize, quantity }];
      }
    });

    showToast(`Added ${product.name} (${selectedSize}) to bag`);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, colorName: string, size: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.product.id === productId && item.selectedColor === colorName && item.selectedSize === size)
      )
    );
  };

  const updateQuantity = (productId: string, colorName: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.product.id === productId &&
            item.selectedColor === colorName &&
            item.selectedSize === size
          ) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist');
      return updated;
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartSubtotal = cart.reduce((total, item) => {
    const price =
      currency === 'NGN'
        ? item.product.priceNGN
        : currency === 'USD'
        ? item.product.priceUSD
        : currency === 'GBP'
        ? item.product.priceGBP
        : item.product.priceEUR;
    return total + price * item.quantity;
  }, 0);

  return (
    <ShopContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlist,
        toggleWishlist,
        isWishlisted,
        isWishlistOpen,
        setIsWishlistOpen,
        quickViewProduct,
        setQuickViewProduct,
        activeLook,
        setActiveLook,
        isSearchOpen,
        setIsSearchOpen,
        isStoryOpen,
        setIsStoryOpen,
        isSizeGuideOpen,
        setIsSizeGuideOpen,
        isCraftsmanshipOpen,
        setIsCraftsmanshipOpen,
        isConciergeOpen,
        setIsConciergeOpen,
        isAuthOpen,
        setIsAuthOpen,
        user,
        login,
        logout,
        currency,
        setCurrency,
        toastMessage,
        showToast
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
