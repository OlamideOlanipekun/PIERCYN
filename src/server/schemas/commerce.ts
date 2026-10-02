import { z } from 'zod';

export const NigerianStateEnum = z.enum([
  'Lagos State',
  'Abuja (FCT)',
  'Rivers State',
  'Oyo State',
  'Ogun State',
  'Delta State',
  'Enugu State',
  'Kano State',
  'Kaduna State',
  'Edo State',
  'Anambra State',
  'Kwara State',
  'Other Nigerian State',
]);

export const ShippingRegionEnum = z.enum(['lagos', 'nationwide']);

export const PaymentMethodEnum = z.enum(['paystack', 'transfer', 'mock']);

export const AddToCartSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 units per line'),
});

export const UpdateCartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(0).max(10),
});

export const CustomerInfoSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required (min 2 characters)').max(100),
  email: z.string().trim().email('A valid email address is required').max(150),
  phone: z.string().trim().min(7, 'A valid phone number is required').max(25),
  state: z.string().min(1, 'State is required'),
  city: z.string().trim().min(2, 'City is required').max(100),
  address: z.string().trim().min(5, 'Delivery address is required').max(300),
  orderNote: z.string().max(500).optional().default(''),
});

export const CheckoutQuoteSchema = z.object({
  shippingRegion: ShippingRegionEnum,
  items: z.array(AddToCartSchema).min(1, 'At least one item is required in cart'),
  discountCode: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  customer: CustomerInfoSchema,
  shippingRegion: ShippingRegionEnum,
  paymentMethod: PaymentMethodEnum,
  items: z.array(AddToCartSchema).min(1, 'Cart cannot be empty'),
  discountCode: z.string().optional(),
});

export const VerifyPaymentSchema = z.object({
  reference: z.string().min(1, 'Transaction reference is required'),
});

export const RegisterUserSchema = z.object({
  email: z.string().trim().email('A valid email address is required').max(150),
  password: z.string().min(4, 'Password must be at least 4 characters').max(100),
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  phone: z.string().trim().max(25).optional(),
  city: z.string().trim().max(100).optional(),
  address: z.string().trim().max(300).optional(),
});

export const LoginUserSchema = z.object({
  email: z.string().trim().email('A valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export const TrackEventSchema = z.object({
  eventType: z.string().min(1),
  sessionId: z.string().optional(),
  customerId: z.string().optional(),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  orderId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export const InventoryAdjustmentSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int(),
  type: z.enum(['PURCHASE', 'SALE', 'RESERVATION', 'RELEASE', 'RETURN', 'ADJUSTMENT', 'DAMAGE']),
  reference: z.string().min(1),
  reason: z.string().optional(),
});
