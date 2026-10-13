import { ALL_PRODUCTS } from '../../data/allProducts';
import { COMMERCE_CONFIG } from '../config/constants';

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
}

export interface DbProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  priceNGN: number;
  costPriceNGN: number; // Unit acquisition cost for gross margin calculations
  priceUSD: number;
  priceGBP: number;
  priceEUR: number;
  categoryId: string;
  collection: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  images: string[];
  videoUrl?: string;
  gsm?: string;
  fit?: string;
  fabric?: string;
  origin?: string;
  careInstructions?: string;
  productStory?: string;
  tag?: string;
  isNewDrop: boolean;
  isBestSeller: boolean;
  isSoldOut: boolean;
  isLimited: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  colour: string;
  colourHex: string;
  priceNGN?: number;
  costPriceNGN?: number;
  priceUSD?: number;
  priceGBP?: number;
  priceEUR?: number;
  image?: string;
  altImage?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbInventory {
  id: string;
  variantId: string;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  damagedStock: number;
  returnedStock: number;
  updatedAt: string;
}

export interface DbInventoryTransaction {
  id: string;
  inventoryId: string;
  variantId: string;
  quantity: number;
  type: 'PURCHASE' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE';
  reference: string;
  reason?: string;
  createdAt: string;
}

export interface DbReservation {
  id: string;
  variantId: string;
  quantity: number;
  reference: string;
  status: 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface DbCustomer {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbAddress {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbCartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbCart {
  id: string;
  sessionId: string;
  customerId?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbOrderItem {
  id: string;
  orderId: string;
  variantId?: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  colour: string;
  size: string;
  unitPriceNGN: number;
  costPriceNGN: number;
  totalPriceNGN: number;
  image: string;
  quantity: number;
  createdAt: string;
}

export type OrderStatusType =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'EXCHANGED';

export interface DbOrderTimelineEntry {
  status: OrderStatusType;
  timestamp: string;
  note?: string;
}

export interface DbOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  orderNote?: string;
  subtotalNGN: number;
  deliveryFeeNGN: number;
  discountNGN: number;
  totalNGN: number;
  currency: string;
  shippingMethodKey: string;
  shippingMethodName: string;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  orderStatus: OrderStatusType;
  shipmentId?: string;
  paidAt?: string;
  timeline: DbOrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
  items: DbOrderItem[];
  // Affiliate attribution (immutable snapshot at order creation)
  affiliateId?: string;
  affiliateLinkId?: string;
  affiliateCode?: string;         // Referral code snapshot
  affiliateAttributedAt?: string; // ISO timestamp of click attribution
}


export interface DbPayment {
  id: string;
  orderId: string;
  provider: 'PAYSTACK' | 'DIRECT_TRANSFER' | 'MOCK';
  reference: string;
  amountNGN: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  rawMetadata?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ShipmentStatusType =
  | 'PENDING'
  | 'READY_FOR_DISPATCH'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED';

export interface DbShipment {
  id: string;
  orderId: string;
  courier: string; // 'KWIK', 'INTERNAL', 'GIG', etc.
  trackingNumber: string;
  status: ShipmentStatusType;
  deliveryFeeNGN: number;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  courierMetadata?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
  address?: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface DbAuthSession {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface DbEvent {
  id: string;
  eventType: string;
  sessionId?: string;
  customerId?: string;
  productId?: string;
  variantId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Order State Machine Transitions
export const VALID_ORDER_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED', 'FAILED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['PACKED', 'CANCELLED', 'REFUNDED'],
  PACKED: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'FAILED', 'RETURNED'],
  DELIVERED: ['COMPLETED', 'RETURNED', 'EXCHANGED'],
  COMPLETED: ['RETURNED', 'REFUNDED', 'EXCHANGED'],
  CANCELLED: [],
  FAILED: ['PENDING_PAYMENT'],
  RETURNED: ['REFUNDED', 'EXCHANGED'],
  REFUNDED: [],
  EXCHANGED: ['PROCESSING'],
};

export class CommerceDataStore {
  public categories: Map<string, DbCategory> = new Map();
  public products: Map<string, DbProduct> = new Map();
  public variants: Map<string, DbVariant> = new Map();
  public skuToVariantId: Map<string, string> = new Map();
  public inventory: Map<string, DbInventory> = new Map(); // Keyed by variantId
  public inventoryTransactions: DbInventoryTransaction[] = [];
  public reservations: Map<string, DbReservation> = new Map();
  public customers: Map<string, DbCustomer> = new Map();
  public customerEmailIndex: Map<string, string> = new Map(); // email (lowercase) -> customerId
  public addresses: Map<string, DbAddress> = new Map();
  public carts: Map<string, DbCart> = new Map(); // Keyed by sessionId
  public cartItems: Map<string, DbCartItem[]> = new Map(); // Keyed by cartId
  public orders: Map<string, DbOrder> = new Map(); // Keyed by orderId
  public orderNumberIndex: Map<string, string> = new Map(); // orderNumber -> orderId
  public payments: Map<string, DbPayment> = new Map(); // Keyed by reference
  public shipments: Map<string, DbShipment> = new Map(); // Keyed by shipmentId
  public orderShipmentIndex: Map<string, string> = new Map(); // orderId -> shipmentId
  public processedWebhooks: Set<string> = new Set();
  public events: DbEvent[] = [];
  public users: Map<string, DbUser> = new Map(); // Keyed by userId
  public userEmailIndex: Map<string, string> = new Map(); // email (lowercase) -> userId
  public authSessions: Map<string, DbAuthSession> = new Map(); // token -> DbAuthSession

  constructor() {
    this.seedFromCatalog();
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  public seedFromCatalog() {
    this.categories.clear();
    this.products.clear();
    this.variants.clear();
    this.skuToVariantId.clear();
    this.inventory.clear();
    this.inventoryTransactions = [];
    this.reservations.clear();
    this.customers.clear();
    this.customerEmailIndex.clear();
    this.addresses.clear();
    this.carts.clear();
    this.cartItems.clear();
    this.orders.clear();
    this.orderNumberIndex.clear();
    this.payments.clear();
    this.shipments.clear();
    this.orderShipmentIndex.clear();
    this.processedWebhooks.clear();
    this.events = [];
    this.users.clear();
    this.userEmailIndex.clear();
    this.authSessions.clear();

    // 1. Categories
    const categoryNames = [
      'hoodies',
      'sweatshirts',
      'tees',
      'polos',
      'jackets',
      'trousers',
      'accessories',
    ];

    categoryNames.forEach((catName, idx) => {
      const catId = `cat-${this.slugify(catName)}`;
      this.categories.set(catId, {
        id: catId,
        name: catName.toUpperCase(),
        slug: this.slugify(catName),
        description: `Signature PIERCYN ${catName} collection`,
        sortOrder: idx,
      });
    });

    // 2. Products & Variants & Inventory
    ALL_PRODUCTS.forEach((p, pIdx) => {
      const catSlug = this.slugify(p.category);
      const catId = `cat-${catSlug}`;
      if (!this.categories.has(catId)) {
        this.categories.set(catId, {
          id: catId,
          name: p.category.toUpperCase(),
          slug: catSlug,
          sortOrder: 10 + pIdx,
        });
      }

      // Unit cost price estimated at ~38% of retail for gross profit tracking
      const costPriceNGN = Math.round(p.priceNGN * 0.38);

      const dbProd: DbProduct = {
        id: p.id,
        slug: p.slug || this.slugify(p.name),
        name: p.name,
        description: p.description,
        shortDescription: p.gsm ? `${p.gsm} • ${p.fit}` : undefined,
        priceNGN: p.priceNGN,
        costPriceNGN,
        priceUSD: p.priceUSD,
        priceGBP: p.priceGBP,
        priceEUR: p.priceEUR,
        categoryId: catId,
        collection: p.collection || 'essentials',
        status: p.status === 'archived' ? 'ARCHIVED' : p.status === 'draft' ? 'DRAFT' : 'ACTIVE',
        images: p.images && p.images.length > 0 ? p.images : (p.colors?.[0]?.image ? [p.colors[0].image] : []),
        gsm: p.gsm,
        fit: p.fit,
        fabric: p.fabric,
        origin: p.origin || 'Handmade in Lagos, Nigeria',
        tag: p.tag,
        isNewDrop: Boolean(p.isNewDrop),
        isBestSeller: Boolean(p.isBestSeller),
        isSoldOut: Boolean(p.isSoldOut),
        isLimited: Boolean(p.isLimited),
        sortOrder: pIdx,
        createdAt: p.createdAt || '2026-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };

      this.products.set(dbProd.id, dbProd);

      // Create Variants (Colors x Sizes)
      const colors = p.colors && p.colors.length > 0 ? p.colors : [{ name: 'Default', hex: '#111111', image: dbProd.images[0] }];
      const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : ['M'];

      colors.forEach((col) => {
        sizes.forEach((sz) => {
          const sku = `PCY-${this.slugify(p.id).toUpperCase()}-${this.slugify(col.name).toUpperCase().slice(0, 3)}-${sz}`;
          const variantId = `var-${this.slugify(sku)}`;

          const variant: DbVariant = {
            id: variantId,
            productId: dbProd.id,
            sku,
            size: sz,
            colour: col.name,
            colourHex: col.hex,
            costPriceNGN,
            image: col.image || dbProd.images[0],
            altImage: col.altImage,
            active: !p.isSoldOut,
            sortOrder: 0,
            createdAt: dbProd.createdAt,
            updatedAt: dbProd.updatedAt,
          };

          this.variants.set(variantId, variant);
          this.skuToVariantId.set(sku, variantId);

          // Initialize Stock
          const initialStock = p.isSoldOut ? 0 : Math.max(8, Math.floor((p.stock || 25) / Math.max(1, colors.length * sizes.length)));
          const invId = `inv-${variantId}`;
          const inv: DbInventory = {
            id: invId,
            variantId,
            availableStock: initialStock,
            reservedStock: 0,
            soldStock: 0,
            damagedStock: 0,
            returnedStock: 0,
            updatedAt: new Date().toISOString(),
          };
          this.inventory.set(variantId, inv);

          // Ledger Transaction
          this.inventoryTransactions.push({
            id: `tx-init-${variantId}`,
            inventoryId: invId,
            variantId,
            quantity: initialStock,
            type: 'PURCHASE',
            reference: 'SYSTEM_INITIALIZATION',
            reason: 'Opening atelier stock',
            createdAt: new Date().toISOString(),
          });
        });
      });
    });

    // 3. Seed Default Admin User
    // Can be overridden via ADMIN_EMAIL and ADMIN_PASSWORD_HASH environment variables
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@piercyn.com').trim().toLowerCase();
    const adminPasswordHash =
      process.env.ADMIN_PASSWORD_HASH ||
      '$2b$10$EawdzBtZHOOVuJUX2RBusuWAvMjETHgkM4G2fdKdac.Ol6FYuoP2i'; // Default: piercynAdmin2026
    const defaultAdmin: DbUser = {
      id: 'usr-admin-01',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: 'PIERCYN',
      lastName: 'Director',
      phone: '+2348000000000',
      city: 'Victoria Island, Lagos',
      address: 'PIERCYN Atelier, Lagos',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(defaultAdmin.id, defaultAdmin);
    this.userEmailIndex.set(defaultAdmin.email.toLowerCase(), defaultAdmin.id);

    // 4. Seed Default Client User
    // Generated with: bcrypt.hashSync('piercyn2026', 10)
    const clientPasswordHash = '$2b$10$A5WRq1KGYVEzyVk1pDWF..SinkgoC/6w2Ev5RgDTgeER/d946eoFy';
    const defaultUser: DbUser = {
      id: 'usr-demo-01',
      email: 'client@piercyn.com',
      passwordHash: clientPasswordHash,
      firstName: 'Tunde',
      lastName: 'Adeleke',
      phone: '+2348120009999',
      city: 'Victoria Island, Lagos',
      address: '14 Admiralty Way, Lekki Phase 1',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(defaultUser.id, defaultUser);
    this.userEmailIndex.set(defaultUser.email.toLowerCase(), defaultUser.id);

    // 5. Seed Initial Cycle 1 Atelier Orders (Development / Live Demo)
    if (process.env.NODE_ENV !== 'test') {
      const allProds = Array.from(this.products.values());
      if (allProds.length > 0) {
        const now = new Date();
        const initialOrdersConfig: Array<{
          orderNumber: string;
          customer: { fullName: string; email: string; phone: string; address: string; city: string; state: string };
          prodIdx: number;
          quantity: number;
          status: OrderStatusType;
          paymentStatus: 'PENDING' | 'PAID';
          paymentMethod: string;
          courier?: string;
          trackingNumber?: string;
          daysAgo: number;
        }> = [
          {
            orderNumber: 'PCY-2601',
            customer: {
              fullName: 'Chuka Ekwueme',
              email: 'chuka.ekwueme@gmail.com',
              phone: '+2348033112244',
              address: '42 Adeola Odeku Street',
              city: 'Victoria Island',
              state: 'Lagos State',
            },
            prodIdx: 0,
            quantity: 2,
            status: 'DELIVERED' as const,
            paymentStatus: 'PAID' as const,
            paymentMethod: 'Paystack Card (Mastercard •••• 4242)',
            courier: 'KWIK Express Dispatch',
            trackingNumber: 'KWK-LAG-88912',
            daysAgo: 2,
          },
          {
            orderNumber: 'PCY-2602',
            customer: {
              fullName: 'Zainab Bello',
              email: 'zainab.bello@lagosatelier.ng',
              phone: '+2348124455667',
              address: '18 Glover Road',
              city: 'Ikoyi',
              state: 'Lagos State',
            },
            prodIdx: 1,
            quantity: 1,
            status: 'PROCESSING' as const,
            paymentStatus: 'PAID' as const,
            paymentMethod: 'Direct Bank Transfer (Access Bank)',
            daysAgo: 1,
          },
          {
            orderNumber: 'PCY-2603',
            customer: {
              fullName: 'Oluwaseun Vance',
              email: 'vance.seun@outlook.com',
              phone: '+2347068899001',
              address: 'Block 4, Flat 12, 1004 Estate',
              city: 'Victoria Island',
              state: 'Lagos State',
            },
            prodIdx: 2,
            quantity: 2,
            status: 'PACKED' as const,
            paymentStatus: 'PAID' as const,
            paymentMethod: 'Paystack Card (Visa •••• 1122)',
            courier: 'GIG Logistics',
            trackingNumber: 'GIG-NGN-004519',
            daysAgo: 0,
          },
          {
            orderNumber: 'PCY-2604',
            customer: {
              fullName: 'Emeka Nwosu',
              email: 'emeka.nwosu@techhub.africa',
              phone: '+2348189922110',
              address: 'Plot 7 Admiralty Road',
              city: 'Lekki Phase 1',
              state: 'Lagos State',
            },
            prodIdx: 3,
            quantity: 1,
            status: 'PENDING_PAYMENT' as const,
            paymentStatus: 'PENDING' as const,
            paymentMethod: 'Direct Bank Transfer',
            daysAgo: 0,
          },
        ];

        initialOrdersConfig.forEach((cfg, idx) => {
          const p = allProds[cfg.prodIdx % allProds.length];
          const pVariants = Array.from(this.variants.values()).filter((v) => v.productId === p.id);
          const v = pVariants[0];
          if (!v) return;

          const orderDate = new Date(now.getTime() - cfg.daysAgo * 86400000).toISOString();
          const orderId = `ord-init-${idx + 1}`;
          const subtotal = p.priceNGN * cfg.quantity;
          const deliveryFee = subtotal >= COMMERCE_CONFIG.SHIPPING.FREE_THRESHOLD_NGN ? 0 : COMMERCE_CONFIG.SHIPPING.LAGOS_FEE_NGN;
          const totalNGN = subtotal + deliveryFee;

          const order: DbOrder = {
            id: orderId,
            orderNumber: cfg.orderNumber,
            customerName: cfg.customer.fullName,
            customerEmail: cfg.customer.email,
            customerPhone: cfg.customer.phone,
            shippingAddressLine: cfg.customer.address,
            shippingCity: cfg.customer.city,
            shippingState: cfg.customer.state,
            shippingCountry: 'Nigeria',
            subtotalNGN: subtotal,
            deliveryFeeNGN: deliveryFee,
            discountNGN: 0,
            totalNGN,
            currency: 'NGN',
            shippingMethodKey: 'lagos',
            shippingMethodName: 'Lagos Atelier Dispatch',
            paymentMethod: cfg.paymentMethod,
            paymentStatus: cfg.paymentStatus,
            orderStatus: cfg.status,
            paidAt: cfg.paymentStatus === 'PAID' ? orderDate : undefined,
            timeline: [
              { status: 'PENDING_PAYMENT', timestamp: orderDate, note: 'Order placed by client' },
              ...(cfg.paymentStatus === 'PAID'
                ? [{ status: 'PAID' as const, timestamp: orderDate, note: `Payment confirmed via ${cfg.paymentMethod}` }]
                : []),
              ...(cfg.status === 'PROCESSING' || cfg.status === 'PACKED' || cfg.status === 'SHIPPED' || cfg.status === 'DELIVERED'
                ? [{ status: 'PROCESSING' as const, timestamp: orderDate, note: 'Order sent to cutting and inspection' }]
                : []),
              ...(cfg.status === 'PACKED' || cfg.status === 'SHIPPED' || cfg.status === 'DELIVERED'
                ? [{ status: 'PACKED' as const, timestamp: orderDate, note: 'Sealed in PIERCYN matte black packaging' }]
                : []),
              ...(cfg.status === 'SHIPPED' || cfg.status === 'DELIVERED'
                ? [{ status: 'SHIPPED' as const, timestamp: orderDate, note: `Dispatched with ${cfg.courier} (${cfg.trackingNumber})` }]
                : []),
              ...(cfg.status === 'DELIVERED'
                ? [{ status: 'DELIVERED' as const, timestamp: orderDate, note: 'Delivered and verified' }]
                : []),
            ],
            createdAt: orderDate,
            updatedAt: orderDate,
            items: [
              {
                id: `item-${orderId}-1`,
                orderId,
                variantId: v.id,
                productId: p.id,
                productName: p.name,
                sku: v.sku,
                category: p.categoryId.replace('cat-', '').toUpperCase(),
                colour: v.colour,
                size: v.size,
                unitPriceNGN: p.priceNGN,
                costPriceNGN: p.costPriceNGN,
                totalPriceNGN: p.priceNGN * cfg.quantity,
                image: p.images[0] || '',
                quantity: cfg.quantity,
                createdAt: orderDate,
              },
            ],
          };

          this.orders.set(orderId, order);
          this.orderNumberIndex.set(order.orderNumber, orderId);

          this.findOrCreateCustomer({
            email: cfg.customer.email,
            fullName: cfg.customer.fullName,
            phone: cfg.customer.phone,
            address: {
              addressLine: cfg.customer.address,
              city: cfg.customer.city,
              state: cfg.customer.state,
            },
          });

          if (cfg.courier && cfg.trackingNumber) {
            this.createShipment({
              orderId,
              courier: cfg.courier,
              trackingNumber: cfg.trackingNumber,
              deliveryFeeNGN: deliveryFee,
              deliveryAddress: `${cfg.customer.address}, ${cfg.customer.city}, ${cfg.customer.state}`,
              recipientName: cfg.customer.fullName,
              recipientPhone: cfg.customer.phone,
            });
          }

          if (cfg.paymentStatus === 'PAID') {
            const inv = this.inventory.get(v.id);
            if (inv) {
              inv.availableStock = Math.max(1, inv.availableStock - cfg.quantity);
              inv.soldStock += cfg.quantity;
            }
          }
        });

        // Ensure 2 variants have low stock and 1 has out of stock for operational visibility
        const allVariants = Array.from(this.variants.values());
        if (allVariants.length >= 3) {
          const inv1 = this.inventory.get(allVariants[1].id);
          if (inv1) inv1.availableStock = 2; // Low stock

          const inv2 = this.inventory.get(allVariants[2].id);
          if (inv2) inv2.availableStock = 1; // Low stock

          const inv3 = this.inventory.get(allVariants[3].id);
          if (inv3) inv3.availableStock = 0; // Out of stock
        }
      }
    }
  }

  // Find or create customer record based on checkout information
  public findOrCreateCustomer(data: {
    email: string;
    fullName: string;
    phone?: string;
    address?: {
      addressLine: string;
      city: string;
      state: string;
      country?: string;
    };
  }): DbCustomer {
    const normalizedEmail = data.email.trim().toLowerCase();
    let customerId = this.customerEmailIndex.get(normalizedEmail);
    let customer = customerId ? this.customers.get(customerId) : undefined;

    const now = new Date().toISOString();

    if (!customer) {
      customerId = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      customer = {
        id: customerId,
        email: normalizedEmail,
        fullName: data.fullName.trim(),
        phone: data.phone?.trim(),
        createdAt: now,
        updatedAt: now,
      };
      this.customers.set(customerId, customer);
      this.customerEmailIndex.set(normalizedEmail, customerId);
    } else {
      customer.fullName = data.fullName.trim();
      if (data.phone) customer.phone = data.phone.trim();
      customer.updatedAt = now;
    }

    // Snapshot address if supplied
    if (data.address) {
      const addressId = `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const address: DbAddress = {
        id: addressId,
        customerId: customer.id,
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || '',
        addressLine: data.address.addressLine.trim(),
        city: data.address.city.trim(),
        state: data.address.state.trim(),
        country: data.address.country || 'Nigeria',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      };
      this.addresses.set(addressId, address);
    }

    return customer;
  }

  // Create Shipment record linked to order
  public createShipment(data: {
    orderId: string;
    courier: string;
    trackingNumber: string;
    deliveryFeeNGN: number;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
    courierMetadata?: string;
  }): DbShipment {
    const shipmentId = `shp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const shipment: DbShipment = {
      id: shipmentId,
      orderId: data.orderId,
      courier: data.courier,
      trackingNumber: data.trackingNumber,
      status: 'PENDING',
      deliveryFeeNGN: data.deliveryFeeNGN,
      deliveryAddress: data.deliveryAddress,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      courierMetadata: data.courierMetadata,
      createdAt: now,
      updatedAt: now,
    };

    this.shipments.set(shipmentId, shipment);
    this.orderShipmentIndex.set(data.orderId, shipmentId);

    const order = this.orders.get(data.orderId);
    if (order) {
      order.shipmentId = shipmentId;
      order.updatedAt = now;
    }

    return shipment;
  }

  // Cleanup expired inventory reservations
  public cleanExpiredReservations() {
    const now = new Date().toISOString();
    for (const [id, res] of this.reservations.entries()) {
      if (res.status === 'ACTIVE' && res.expiresAt < now) {
        res.status = 'EXPIRED';
        const inv = this.inventory.get(res.variantId);
        if (inv) {
          inv.reservedStock = Math.max(0, inv.reservedStock - res.quantity);
          inv.availableStock += res.quantity;
          inv.updatedAt = now;

          this.inventoryTransactions.push({
            id: `tx-rel-exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            inventoryId: inv.id,
            variantId: res.variantId,
            quantity: res.quantity,
            type: 'RELEASE',
            reference: res.reference,
            reason: 'Checkout reservation expired (TTL)',
            createdAt: now,
          });
        }
      }
    }
  }
}

export const dbStore = new CommerceDataStore();
