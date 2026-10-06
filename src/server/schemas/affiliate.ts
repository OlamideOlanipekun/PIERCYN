import { z } from 'zod';

// ─── AFFILIATE APPLICATION ─────────────────────────────────────────────────

export const AffiliateApplySchema = z.object({
  email: z.string().trim().email('A valid email address is required').max(150),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  phone: z.string().trim().min(7, 'A valid phone number is required').max(25),
  instagram: z.string().trim().max(100).optional(),
  tiktok: z.string().trim().max(100).optional(),
  otherSocials: z.string().max(500).optional(),
  promotionChannels: z.string().max(500).optional(),
  audienceSize: z.string().max(50).optional(),
  promotionExperience: z.string().max(1000).optional(),
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the affiliate terms and conditions.',
  }),
});

// ─── AFFILIATE LOGIN ───────────────────────────────────────────────────────

export const AffiliateLoginSchema = z.object({
  email: z.string().trim().email('A valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

// ─── AFFILIATE LINK CREATION ──────────────────────────────────────────────

export const CreateAffiliateLinkSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Link name must be at least 3 characters')
    .max(100, 'Link name must be under 100 characters'),
  destination: z
    .string()
    .trim()
    .min(1, 'Destination is required')
    .regex(/^\//, 'Destination must start with /'),
  destinationType: z.enum(['collection', 'product', 'homepage']).default('collection'),
});

// ─── AFFILIATE PROFILE UPDATE ─────────────────────────────────────────────

export const UpdateAffiliateProfileSchema = z.object({
  instagram: z.string().trim().max(100).optional(),
  tiktok: z.string().trim().max(100).optional(),
  otherSocials: z.string().max(500).optional(),
  promotionChannels: z.string().max(500).optional(),
  audienceSize: z.string().max(50).optional(),
  bankName: z.string().trim().min(2).max(100).optional(),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Account number must be 10 digits')
    .optional(),
  accountName: z.string().trim().min(2).max(100).optional(),
});

// ─── PAYOUT REQUEST ────────────────────────────────────────────────────────

export const RequestAffiliatePayoutSchema = z.object({
  amountNGN: z.number().finite('Withdrawal amount must be a valid number').positive('Withdrawal amount must be greater than zero').refine((amount) => Number.isInteger(amount * 100), 'Withdrawal amount cannot exceed two decimal places'),
  bankName: z.string().trim().min(2, 'Bank name is required').max(100),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  accountName: z.string().trim().min(2, 'Account name is required').max(100),
});

export const RequestPayoutSchema = RequestAffiliatePayoutSchema;

// ─── CLICK TRACKING ───────────────────────────────────────────────────────

export const TrackAffiliateClickSchema = z.object({
  code: z.string().trim().min(3).max(20).optional(),
  referralCode: z.string().trim().min(3).max(20).optional(),
  sessionId: z.string().min(1),
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  landingPage: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  referrerUrl: z.string().max(500).optional(),
}).refine(data => Boolean(data.code || data.referralCode), {
  message: 'Either code or referralCode is required',
});

export const TrackClickSchema = TrackAffiliateClickSchema;

// ─── ADMIN AFFILIATE ACTIONS ──────────────────────────────────────────────

export const ReviewAffiliateApplicationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'Approve', 'Reject']).transform(v => v.toUpperCase() as 'APPROVE' | 'REJECT'),
  rejectionReason: z.string().max(500).optional(),
  adminNotes: z.string().max(500).optional(),
});

export const AdminAffiliateActionSchema = ReviewAffiliateApplicationSchema;

export const ProcessAffiliatePayoutSchema = z.object({
  action: z.enum(['PAID', 'REJECTED', 'APPROVED', 'Paid', 'Rejected', 'Approved']).transform(v => v.toUpperCase() as 'PAID' | 'REJECTED' | 'APPROVED'),
  payoutReference: z.string().trim().max(100).optional(),
  paymentReference: z.string().trim().max(100).optional(),
  notes: z.string().max(500).optional(),
  adminNote: z.string().max(500).optional(),
  reason: z.string().max(500).optional(),
});

export const AdminMarkPayoutPaidSchema = ProcessAffiliatePayoutSchema;
export const AdminRejectPayoutSchema = ProcessAffiliatePayoutSchema;
