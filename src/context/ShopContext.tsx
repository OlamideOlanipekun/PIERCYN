import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, LookbookLook, Currency, UserProfile, Order, CustomerInfo } from '../types';
import { eventTracker } from '../services/eventTracker';
import { api } from '../services/apiClient';
import { catalogService, mapServerProduct } from '../services/catalogService';
import { resolveProductVariant } from '../utils/variants';
import { getActiveAffiliateCode } from '../utils/affiliateTracking';

export interface CreateOrderPayload {
  customer: CustomerInfo;
  shippingRegion: 'lagos' | 'nationwide';
  paymentMethod: 'paystack' | 'transfer' | 'mock';
  items: { variantId: string; quantity: number }[];
  discountCode?: string;
  affiliateCode?: string;
}

interface ShopContextType {
  // Catalog
  products: Product[];
  isLoadingProducts: boolean;
  catalogError: string | null;
  refreshProducts: () => Promise<void>;
  getProductBySlug: (slug: string) => Promise<Product | null>;

  // Server-Backed Cart
  cart: CartItem[];
  isCartLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, colorName?: string, size?: string, quantity?: number, variantId?: string) => Promise<boolean>;
  removeFromCart: (param1: string, param2?: string, param3?: string) => Promise<void>;
  updateQuantity: (param1: string, param2: string | number, param3?: string, param4?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartSubtotal: number;
  
  // Promo code & discount
  appliedPromoCode: string | null;
  promoDiscountNGN: number;
  promoDescription: string | null;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string; discountNGN?: number }>;
  removePromoCode: () => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;

  // Checkout & Orders
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isOrderConfirmedOpen: boolean;
  setIsOrderConfirmedOpen: (open: boolean) => void;
  lastCreatedOrder: Order | null;
  setLastCreatedOrder: (order: Order | null) => void;
  orders: Order[];
  createOrder: (payload: CreateOrderPayload) => Promise<Order>;

  // Admin Drawer
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;

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
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    address?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Currency
  currency: Currency;
  setCurrency: (currency: Currency) => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

function mapCalculatedCartToItems(calculated: any, availableProducts: Product[]): CartItem[] {
  if (!calculated || !Array.isArray(calculated.items)) return [];
  return calculated.items.map((line: any) => {
    const matchedProduct = availableProducts.find((p) => p.id === line.productId);
    const product: Product = matchedProduct || {
      id: line.productId,
      name: line.productName,
      category: line.category as any,
      collection: 'essentials',
      priceNGN: line.unitPriceNGN,
      priceUSD: line.unitPriceUSD,
      priceGBP: line.unitPriceGBP,
      priceEUR: line.unitPriceEUR,
      description: line.productName,
      fit: 'Relaxed fit',
      fabric: 'Cotton',
      origin: 'Lagos, Nigeria',
      colors: [{ name: line.colour, hex: line.colourHex, image: line.image }],
      sizes: [line.size as any],
      images: [line.image],
      stock: line.availableStock,
    };

    return {
      product,
      variantId: line.variantId,
      selectedColor: line.colour,
      selectedSize: line.size,
      quantity: line.quantity,
    };
  });
}

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Live Backend Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // 2. Server-Backed Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState(0);

  // 3. User & Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('piercyn_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderConfirmedOpen, setIsOrderConfirmedOpen] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Promo discount state
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem('piercyn_promo_code');
    } catch {
      return null;
    }
  });
  const [promoDiscountNGN, setPromoDiscountNGN] = useState<number>(0);
  const [promoDescription, setPromoDescription] = useState<string | null>(null);

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

  // Fetch catalog from GET /api/products
  const refreshProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setCatalogError(null);
    try {
      const serverProducts = await catalogService.getProducts();
      setProducts(serverProducts);
    } catch (err: any) {
      console.error('[CATALOG_LOAD_ERROR]', err);
      setCatalogError('Unable to load latest pieces. Please refresh.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Fetch product by slug from GET /api/products/:slug
  const getProductBySlug = useCallback(async (slug: string): Promise<Product | null> => {
    if (!slug) return null;
    const cleanSlug = slug.toLowerCase().trim();
    // Check in-memory first
    const inMemory = products.find(
      (p) =>
        p.slug === cleanSlug ||
        (p.id && p.id.toLowerCase() === cleanSlug) ||
        (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug)
    );
    if (inMemory) return inMemory;

    // Fetch from backend
    return catalogService.getProductBySlug(cleanSlug);
  }, [products]);

  // Initialize server cart from GET /api/cart
  useEffect(() => {
    const initServerCart = async () => {
      try {
        const res = await api.getCart();
        if (res.success && res.data) {
          const calculated = res.data;
          const items = mapCalculatedCartToItems(calculated, products);
          setCart(items);
          setCartSubtotal(calculated.subtotalNGN || 0);
          setCartCount(calculated.itemCount || 0);
        }
      } catch {
        // Fallback
      }
    };

    initServerCart();
  }, [products]);

  // Sync orders from server backend on mount
  useEffect(() => {
    const fetchServerOrders = async () => {
      try {
        const res = await api.getOrders(user?.email);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: Order[] = res.data.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customer: {
              fullName: o.customerName,
              email: o.customerEmail,
              phone: o.customerPhone,
              state: o.shippingState,
              city: o.shippingCity,
              address: o.shippingAddressLine,
              orderNote: o.orderNote,
            },
            items: o.items.map((it: any) => ({
              productId: it.productId,
              variantId: it.variantId,
              sku: it.sku,
              productName: it.productName,
              category: it.category,
              color: it.colour,
              size: it.size,
              quantity: it.quantity,
              unitPriceNGN: it.unitPriceNGN,
              totalPriceNGN: it.totalPriceNGN,
              image: it.image,
            })),
            subtotalNGN: o.subtotalNGN,
            deliveryFeeNGN: o.deliveryFeeNGN,
            discountNGN: o.discountNGN || 0,
            totalNGN: o.totalNGN,
            shippingMethod: o.shippingMethodName,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            orderStatus: o.orderStatus === 'PENDING_PAYMENT' ? 'CONFIRMED' : o.orderStatus,
            createdAt: o.createdAt,
          }));
          setOrders(mapped);
        }
      } catch {
        // Fallback
      }
    };

    fetchServerOrders();
  }, [user?.email]);

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

  useEffect(() => {
    try {
      localStorage.setItem('piercyn_wishlist', JSON.stringify(wishlist));
    } catch {
      // storage unavailable
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      if (appliedPromoCode) {
        localStorage.setItem('piercyn_promo_code', appliedPromoCode);
      } else {
        localStorage.removeItem('piercyn_promo_code');
      }
    } catch {
      // storage unavailable
    }
  }, [appliedPromoCode]);

  // Validate active auth session on startup
  useEffect(() => {
    const restoreAuthSession = async () => {
      try {
        const token = localStorage.getItem('piercyn_auth_token');
        if (token) {
          const res = await api.getMe();
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            localStorage.removeItem('piercyn_auth_token');
            setUser(null);
          }
        }
      } catch {
        // storage/network fallback
      }
    };
    restoreAuthSession();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.login({
        email: email.trim(),
        password: password?.trim() || 'piercyn2026',
      });
      if (res.success && res.data) {
        localStorage.setItem('piercyn_auth_token', res.data.token);
        setUser(res.data.user);
        showToast(`Welcome back to PIERCYN, ${res.data.user.firstName}`);
        return { success: true };
      } else {
        const err = res.error || 'Authentication failed. Please check your credentials.';
        showToast(err);
        return { success: false, error: err };
      }
    } catch (err: any) {
      const msg = err.message || 'Unable to connect to PIERCYN authentication server.';
      showToast(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    address?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.register(data);
      if (res.success && res.data) {
        localStorage.setItem('piercyn_auth_token', res.data.token);
        setUser(res.data.user);
        showToast(`Welcome to PIERCYN Atelier, ${res.data.user.firstName}`);
        return { success: true };
      } else {
        const err = res.error || 'Account creation failed. Please try again.';
        showToast(err);
        return { success: false, error: err };
      }
    } catch (err: any) {
      const msg = err.message || 'Unable to connect to PIERCYN authentication server.';
      showToast(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('piercyn_auth_token');
      localStorage.removeItem('piercyn_user');
      setUser(null);
      showToast('Signed out of your PIERCYN account');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Authoritative Server-Synced Add to Cart
  const addToCart = async (
    product: Product,
    colorName?: string,
    size?: string,
    quantity: number = 1,
    explicitVariantId?: string
  ): Promise<boolean> => {
    const resolved = resolveProductVariant(product, colorName, size);
    const variantId = explicitVariantId || resolved.id;
    const selectedSize = resolved.size;

    setIsCartLoading(true);
    try {
      const res = await api.addToCart(variantId, quantity);
      if (res.success && res.data) {
        const calculated = res.data;
        const items = mapCalculatedCartToItems(calculated, products);
        setCart(items);
        setCartSubtotal(calculated.subtotalNGN || 0);
        setCartCount(calculated.itemCount || 0);

        eventTracker.track('add_to_cart', {
          productId: product.id,
          variantId,
          productName: product.name,
          priceNGN: product.priceNGN,
          selectedColor: resolved.colour,
          selectedSize: resolved.size,
          quantity,
        });

        showToast(`Added ${product.name} (${selectedSize}) to bag`);
        setIsCartOpen(true);
        setIsCartLoading(false);
        return true;
      } else {
        const errorMsg = res.error || 'That piece or size is currently unavailable.';
        showToast(errorMsg);
        setIsCartLoading(false);
        return false;
      }
    } catch {
      showToast('We couldn\'t add this item to your bag. Please try again.');
      setIsCartLoading(false);
      return false;
    }
  };

  // Authoritative Server-Synced Remove From Cart
  const removeFromCart = async (param1: string, param2?: string, param3?: string) => {
    let targetVariantId = param1;
    if (param2 && param3) {
      const productId = param1;
      const colorName = param2;
      const size = param3;
      const item = cart.find(
        (it) => it.product.id === productId && it.selectedColor === colorName && it.selectedSize === size
      );
      if (!item) return;
      targetVariantId = item.variantId;
    }

    setIsCartLoading(true);
    try {
      const res = await api.updateCartItem(targetVariantId, 0);
      if (res.success && res.data) {
        const calculated = res.data;
        const items = mapCalculatedCartToItems(calculated, products);
        setCart(items);
        setCartSubtotal(calculated.subtotalNGN || 0);
        setCartCount(calculated.itemCount || 0);
      }
    } catch {
      showToast('We couldn\'t remove the piece. Please try again.');
    } finally {
      setIsCartLoading(false);
    }
  };

  // Authoritative Server-Synced Update Quantity
  const updateQuantity = async (
    param1: string,
    param2: string | number,
    param3?: string,
    param4?: number
  ) => {
    let targetVariantId = param1;
    let delta = typeof param2 === 'number' ? param2 : (param4 || 0);

    if (typeof param2 === 'string') {
      const productId = param1;
      const colorName = param2;
      const size = param3;
      const item = cart.find(
        (it) => it.product.id === productId && it.selectedColor === colorName && it.selectedSize === size
      );
      if (!item) return;
      targetVariantId = item.variantId;
    }

    const currentItem = cart.find((it) => it.variantId === targetVariantId);
    if (!currentItem) return;

    const newQty = currentItem.quantity + delta;
    setIsCartLoading(true);
    try {
      const res = await api.updateCartItem(targetVariantId, newQty);
      if (res.success && res.data) {
        const calculated = res.data;
        const items = mapCalculatedCartToItems(calculated, products);
        setCart(items);
        setCartSubtotal(calculated.subtotalNGN || 0);
        setCartCount(calculated.itemCount || 0);
      } else if (res.error) {
        showToast(res.error);
      }
    } catch {
      showToast('We couldn\'t update your bag. Please try again.');
    } finally {
      setIsCartLoading(false);
    }
  };

  // Authoritative Server-Synced Clear Cart
  const clearCart = async () => {
    setIsCartLoading(true);
    try {
      await api.clearCart();
      setCart([]);
      setCartSubtotal(0);
      setCartCount(0);
    } catch {
      // Non-blocking
    } finally {
      setIsCartLoading(false);
    }
  };

  // Authoritative Server Promo Code Verification
  const applyPromoCode = async (code: string): Promise<{ success: boolean; message: string; discountNGN?: number }> => {
    if (!code || !code.trim()) {
      removePromoCode();
      return { success: false, message: 'Please enter a promo code.' };
    }

    try {
      const itemsPayload = cart.map((it) => ({
        variantId: it.variantId,
        quantity: it.quantity,
      }));

      const quoteRes = await api.getCheckoutQuote('lagos', itemsPayload, code.trim());
      if (quoteRes.success && quoteRes.data && quoteRes.data.discountNGN > 0) {
        const upperCode = code.trim().toUpperCase();
        setAppliedPromoCode(upperCode);
        setPromoDiscountNGN(quoteRes.data.discountNGN);
        setPromoDescription(quoteRes.data.discountDescription || 'Promo code applied');
        showToast(`Promo "${upperCode}" applied: -₦${quoteRes.data.discountNGN.toLocaleString()}`);
        return {
          success: true,
          message: `${quoteRes.data.discountDescription || 'Discount applied'} (-₦${quoteRes.data.discountNGN.toLocaleString()})`,
          discountNGN: quoteRes.data.discountNGN,
        };
      } else {
        removePromoCode();
        showToast('Invalid promo code. Please check your code.');
        return { success: false, message: 'Invalid promo code. Please check your code.' };
      }
    } catch {
      return { success: false, message: 'Unable to validate promo code. Please try again.' };
    }
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
    setPromoDiscountNGN(0);
    setPromoDescription(null);
  };

  // Authoritative Server-Side Order Creation
  const createOrder = async (orderPayload: CreateOrderPayload): Promise<Order> => {
    const affiliateCode = orderPayload.affiliateCode || getActiveAffiliateCode() || undefined;
    const res = await api.createOrder({
      customer: orderPayload.customer,
      shippingRegion: orderPayload.shippingRegion,
      paymentMethod: orderPayload.paymentMethod,
      items: orderPayload.items,
      discountCode: orderPayload.discountCode || appliedPromoCode || undefined,
      affiliateCode,
    });

    if (!res.success || !res.data) {
      const errorMsg = res.error || 'Failed to complete order. Please check item availability.';
      throw new Error(errorMsg);
    }

    const o = res.data;
    const mappedOrder: Order = {
      id: o.id,
      orderNumber: o.orderNumber,
      customer: {
        fullName: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        state: o.shippingState,
        city: o.shippingCity,
        address: o.shippingAddressLine,
        orderNote: o.orderNote,
      },
      items: o.items.map((it: any) => ({
        productId: it.productId,
        variantId: it.variantId,
        sku: it.sku,
        productName: it.productName,
        category: it.category,
        color: it.colour,
        size: it.size,
        quantity: it.quantity,
        unitPriceNGN: it.unitPriceNGN,
        totalPriceNGN: it.totalPriceNGN,
        image: it.image,
      })),
      subtotalNGN: o.subtotalNGN,
      deliveryFeeNGN: o.deliveryFeeNGN,
      discountNGN: o.discountNGN || 0,
      totalNGN: o.totalNGN,
      shippingMethod: o.shippingMethodName,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus === 'PENDING_PAYMENT' ? 'CONFIRMED' : o.orderStatus,
      createdAt: o.createdAt,
      orderAccessToken: o.orderAccessToken,
    };

    if (mappedOrder.orderAccessToken) {
      localStorage.setItem(`piercyn_order_access_${mappedOrder.id}`, mappedOrder.orderAccessToken);
    }

    setOrders((prev) => [mappedOrder, ...prev]);
    setLastCreatedOrder(mappedOrder);

    eventTracker.track('purchase', {
      orderNumber: mappedOrder.orderNumber,
      totalNGN: mappedOrder.totalNGN,
      itemCount: mappedOrder.items.length,
      customerEmail: mappedOrder.customer.email,
    });

    // Clear cart & applied promo only upon confirmed backend creation
    clearCart();
    removePromoCode();
    return mappedOrder;
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

  return (
    <ShopContext.Provider
      value={{
        products,
        isLoadingProducts,
        catalogError,
        refreshProducts,
        getProductBySlug,
        cart,
        isCartLoading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        appliedPromoCode,
        promoDiscountNGN,
        promoDescription,
        applyPromoCode,
        removePromoCode,
        wishlist,
        toggleWishlist,
        isWishlisted,
        isWishlistOpen,
        setIsWishlistOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isOrderConfirmedOpen,
        setIsOrderConfirmedOpen,
        lastCreatedOrder,
        setLastCreatedOrder,
        orders,
        createOrder,
        isAdminOpen,
        setIsAdminOpen,
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
        register,
        logout,
        currency,
        setCurrency,
        toastMessage,
        showToast,
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
