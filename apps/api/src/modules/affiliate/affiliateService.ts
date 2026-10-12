import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { COMMERCE_CONFIG } from '../../config/constants';
import { prisma } from '../../db/prisma';
import { AffiliateAuthService } from './affiliateAuthService';

// ============================================================
// AFFILIATE SERVICE
// Core business logic: applications, link management, attribution,
// analytics, and payout requests.
// ============================================================

const ATTRIBUTION_WINDOW_DAYS = COMMERCE_CONFIG.AFFILIATE.ATTRIBUTION_WINDOW_DAYS;
const MIN_PAYOUT_KOBO = COMMERCE_CONFIG.AFFILIATE.MIN_PAYOUT_KOBO;

/** Generate a cryptographically-random referral code suffix. */
function generateReferralCode(firstName: string, lastName: string): string {
  const prefix = (firstName.slice(0, 4) + lastName.slice(0, 2))
    .toUpperCase()
    .replace(/[^A-Z]/g, '') || 'AFF';
  const suffix = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `${prefix}${suffix}`;
}

/** Generate a collision-free referral code (retries until unique) */
async function generateUniqueReferralCode(
  firstName: string,
  lastName: string
): Promise<string> {
  let attempts = 0;
  while (attempts < 20) {
    const code = generateReferralCode(firstName, lastName);
    const existing = await prisma.affiliateLink.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
    attempts++;
  }
  // Fallback: use random hex suffix
  return `AFF${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export class AffiliateService {
  // ─── APPLICATION ──────────────────────────────────────────────────────────

  public static async apply(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    instagram?: string;
    tiktok?: string;
    otherSocials?: string;
    promotionChannels?: string;
    audienceSize?: string;
    promotionExperience?: string;
    agreedToTerms: boolean;
  }) {
    const email = data.email.trim().toLowerCase();

    const existing = await prisma.affiliate.findUnique({ where: { email } });
    if (existing) {
      throw new Error('An affiliate account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(data.password.trim(), 10);

    const affiliate = await prisma.affiliate.create({
      data: {
        email,
        passwordHash,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
        instagram: data.instagram?.trim() || null,
        tiktok: data.tiktok?.trim() || null,
        otherSocials: data.otherSocials || null,
        promotionChannels: data.promotionChannels || null,
        audienceSize: data.audienceSize || null,
        promotionExperience: data.promotionExperience?.trim() || null,
        status: 'PENDING',
        isActive: false,
      },
    });

    const token = AffiliateAuthService.generateToken({
      id: affiliate.id,
      email: affiliate.email,
      firstName: affiliate.firstName,
      lastName: affiliate.lastName,
      status: affiliate.status,
      createdAt: affiliate.createdAt,
    });

    return {
      affiliate: {
        id: affiliate.id,
        email: affiliate.email,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        status: affiliate.status,
        appliedAt: affiliate.appliedAt.toISOString(),
        createdAt: affiliate.createdAt.toISOString(),
      },
      token,
    };
  }

  public static async applyForAffiliate(data: any) {
    return this.apply(data);
  }

  // ─── PROFILE ──────────────────────────────────────────────────────────────

  public static async getAffiliateById(affiliateId: string) {
    return this.getProfile(affiliateId);
  }

  public static async getProfile(affiliateId: string) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!affiliate) throw new Error('Affiliate not found');

    return {
      id: affiliate.id,
      email: affiliate.email,
      firstName: affiliate.firstName,
      lastName: affiliate.lastName,
      phone: affiliate.phone,
      instagram: affiliate.instagram,
      tiktok: affiliate.tiktok,
      otherSocials: affiliate.otherSocials,
      promotionChannels: affiliate.promotionChannels,
      audienceSize: affiliate.audienceSize,
      status: affiliate.status,
      bankName: affiliate.bankName,
      accountNumber: affiliate.accountNumber,
      accountNumberMasked: affiliate.accountNumber
        ? `****${affiliate.accountNumber.slice(-4)}`
        : null,
      accountName: affiliate.accountName,
      appliedAt: affiliate.appliedAt.toISOString(),
      approvedAt: affiliate.approvedAt?.toISOString() || null,
      createdAt: affiliate.createdAt.toISOString(),
    };
  }

  public static async updateProfile(
    affiliateId: string,
    data: {
      instagram?: string;
      tiktok?: string;
      otherSocials?: string;
      promotionChannels?: string;
      audienceSize?: string;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    }
  ) {
    const updated = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        instagram: data.instagram !== undefined ? data.instagram.trim() : undefined,
        tiktok: data.tiktok !== undefined ? data.tiktok.trim() : undefined,
        otherSocials: data.otherSocials !== undefined ? data.otherSocials : undefined,
        promotionChannels:
          data.promotionChannels !== undefined ? data.promotionChannels : undefined,
        audienceSize: data.audienceSize !== undefined ? data.audienceSize : undefined,
        bankName: data.bankName !== undefined ? data.bankName.trim() : undefined,
        accountNumber: data.accountNumber !== undefined ? data.accountNumber.trim() : undefined,
        accountName: data.accountName !== undefined ? data.accountName.trim() : undefined,
      },
    });

    return {
      success: true,
      id: updated.id,
      bankName: updated.bankName,
      accountNumber: updated.accountNumber,
      accountName: updated.accountName,
      instagram: updated.instagram,
      tiktok: updated.tiktok,
    };
  }

  // ─── LINKS ────────────────────────────────────────────────────────────────

  public static async createLink(
    affiliateId: string,
    data: { name: string; destination: string; destinationType?: string }
  ) {
    const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
    if (!affiliate || affiliate.status !== 'ACTIVE') {
      throw new Error('Only active affiliates can create referral links.');
    }

    const referralCode = await generateUniqueReferralCode(
      affiliate.firstName,
      affiliate.lastName
    );

    const link = await prisma.affiliateLink.create({
      data: {
        affiliateId,
        name: data.name.trim(),
        referralCode,
        destination: data.destination.trim(),
        destinationType: data.destinationType || 'collection',
        isActive: true,
      },
    });

    const appUrl = COMMERCE_CONFIG.APP_URL;

    return {
      id: link.id,
      name: link.name,
      referralCode: link.referralCode,
      destination: link.destination,
      destinationType: link.destinationType,
      fullUrl: `${appUrl}${link.destination}?ref=${link.referralCode}`,
      isActive: link.isActive,
      clickCount: link.clickCount,
      orderCount: link.orderCount,
      createdAt: link.createdAt.toISOString(),
    };
  }

  /** Compatibility alias used by the affiliate router. */
  public static async createAffiliateLink(
    affiliateId: string,
    data: { name: string; destination: string; destinationType?: string }
  ) {
    return this.createLink(affiliateId, data);
  }

  public static async getLinks(affiliateId: string) {
    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });

    const appUrl = COMMERCE_CONFIG.APP_URL;

    return links.map((link) => ({
      id: link.id,
      name: link.name,
      referralCode: link.referralCode,
      destination: link.destination,
      destinationType: link.destinationType,
      fullUrl: `${appUrl}${link.destination}?ref=${link.referralCode}`,
      isActive: link.isActive,
      clickCount: link.clickCount,
      orderCount: link.orderCount,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString(),
    }));
  }

  /** Compatibility alias used by the affiliate router. */
  public static async getAffiliateLinks(affiliateId: string) {
    return this.getLinks(affiliateId);
  }

  public static async getLinkByCode(code: string) {
    const cleanCode = code.trim().toUpperCase();
    const link = await prisma.affiliateLink.findUnique({
      where: { referralCode: cleanCode },
      include: { affiliate: true },
    });
    if (!link || !link.isActive || link.affiliate.status !== 'ACTIVE') return null;

    return {
      id: link.id,
      code: link.referralCode,
      destination: link.destination,
      destinationType: link.destinationType,
      isActive: link.isActive,
      affiliate: {
        id: link.affiliate.id,
        firstName: link.affiliate.firstName,
        lastName: link.affiliate.lastName,
        status: link.affiliate.status,
      },
    };
  }

  // ─── ATTRIBUTION / CLICK TRACKING ─────────────────────────────────────────

  public static async validateReferralCode(referralCode: string) {
    const link = await prisma.affiliateLink.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      include: { affiliate: true },
    });

    if (!link || !link.isActive) return null;
    if (!link.affiliate || link.affiliate.status !== 'ACTIVE') return null;

    const appUrl = COMMERCE_CONFIG.APP_URL;

    return {
      affiliateId: link.affiliateId,
      affiliateLinkId: link.id,
      referralCode: link.referralCode,
      destination: link.destination,
      destinationType: link.destinationType,
      fullUrl: `${appUrl}${link.destination}?ref=${link.referralCode}`,
      affiliateName: `${link.affiliate.firstName} ${link.affiliate.lastName}`.trim(),
    };
  }

  public static async trackClick(data: {
    code?: string;
    referralCode?: string;
    sessionId: string;
    customerId?: string;
    customerEmail?: string;
    ipAddress?: string;
    ipHash?: string;
    userAgent?: string;
    landingPage?: string;
    referrer?: string;
    referrerUrl?: string;
  }) {
    const codeToUse = (data.code || data.referralCode || '').trim().toUpperCase();
    const validated = await this.validateReferralCode(codeToUse);
    if (!validated) {
      throw new Error('Invalid or inactive referral code.');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Compute privacy-safe IP hash if raw IP is provided
    let ipHash = data.ipHash;
    if (!ipHash && data.ipAddress) {
      ipHash = crypto.createHash('sha256').update(data.ipAddress).digest('hex');
    }

    // Record click event
    await prisma.affiliateClick.create({
      data: {
        affiliateId: validated.affiliateId,
        affiliateLinkId: validated.affiliateLinkId,
        sessionId: data.sessionId,
        customerId: data.customerId || null,
        ipHash: ipHash || null,
        userAgent: data.userAgent ? data.userAgent.substring(0, 500) : null,
        landingPage: data.landingPage || null,
        referrerUrl: data.referrer || data.referrerUrl || null,
      },
    });

    // Increment click counter
    await prisma.affiliateLink.update({
      where: { id: validated.affiliateLinkId },
      data: { clickCount: { increment: 1 } },
    });

    // Upsert attribution (LAST VALID CLICK WINS)
    const attribution = await prisma.affiliateAttribution.upsert({
      where: { sessionId: data.sessionId },
      update: {
        affiliateId: validated.affiliateId,
        affiliateLinkId: validated.affiliateLinkId,
        referralCode: validated.referralCode,
        clickedAt: now,
        expiresAt,
        customerId: data.customerId || undefined,
        customerEmail: data.customerEmail || undefined,
      },
      create: {
        sessionId: data.sessionId,
        affiliateId: validated.affiliateId,
        affiliateLinkId: validated.affiliateLinkId,
        referralCode: validated.referralCode,
        clickedAt: now,
        expiresAt,
        customerId: data.customerId || null,
        customerEmail: data.customerEmail || null,
      },
    });

    return {
      success: true,
      attribution: {
        id: attribution.id,
        sessionId: attribution.sessionId,
        affiliateId: attribution.affiliateId,
        referralCode: attribution.referralCode,
        expiresAt: attribution.expiresAt.toISOString(),
      },
      link: {
        id: validated.affiliateLinkId,
        code: validated.referralCode,
        destination: validated.destination,
        destinationType: validated.destinationType,
      },
    };
  }

  public static async recordClick(data: any) {
    return this.trackClick(data);
  }

  public static async getAttribution(sessionId: string) {
    const attribution = await prisma.affiliateAttribution.findUnique({
      where: { sessionId },
      include: {
        affiliate: true,
        affiliateLink: true,
      },
    });

    if (!attribution) return null;
    if (attribution.expiresAt < new Date()) return null;
    if (!attribution.affiliate || attribution.affiliate.status !== 'ACTIVE') return null;
    if (!attribution.affiliateLink || !attribution.affiliateLink.isActive) return null;

    return {
      affiliateId: attribution.affiliateId,
      affiliateLinkId: attribution.affiliateLinkId,
      referralCode: attribution.referralCode,
      customerEmail: attribution.customerEmail || undefined,
      clickedAt: attribution.clickedAt,
      expiresAt: attribution.expiresAt,
    };
  }

  public static async resolveAttribution(sessionId: string, explicitCode?: string) {
    if (explicitCode) {
      const validated = await this.validateReferralCode(explicitCode);
      if (validated) {
        return {
          affiliateId: validated.affiliateId,
          affiliateLinkId: validated.affiliateLinkId,
          referralCode: validated.referralCode,
          clickedAt: new Date(),
        };
      }
    }
    return this.getAttribution(sessionId);
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────

  public static async getAttributedOrders(
    affiliateId: string,
    options?: { limit?: number; offset?: number }
  ) {
    const orders = await prisma.order.findMany({
      where: { affiliateId },
      include: {
        items: true,
        commissions: {
          where: { affiliateId },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return orders.map((order) => {
      const totalCommissionKobo = order.commissions.reduce(
        (sum, c) => sum + c.amountKobo,
        0
      );
      const commissionStatus =
        order.commissions.length === 0
          ? 'NONE'
          : order.commissions.every((c) => c.status === 'PAID')
          ? 'PAID'
          : order.commissions.every((c) => c.status === 'REVERSED')
          ? 'REVERSED'
          : order.commissions.some((c) => c.status === 'AVAILABLE')
          ? 'AVAILABLE'
          : 'PENDING';

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
        subtotalNGN: order.subtotalNGN,
        totalNGN: order.totalNGN,
        status: order.status,
        paymentStatus: order.paymentStatus,
        commissionNGN: totalCommissionKobo / 100,
        commissionStatus,
        attributedAt: order.affiliateAttributedAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
      };
    });
  }

  public static async getAffiliateOrders(affiliateId: string) {
    return this.getAttributedOrders(affiliateId);
  }

  // ─── COMMISSIONS & EARNINGS ───────────────────────────────────────────────

  public static async getCommissions(
    affiliateId: string,
    options?: { status?: string; limit?: number; offset?: number }
  ) {
    const where: any = { affiliateId };
    if (options?.status && options.status !== 'ALL') {
      where.status = options.status;
    }

    const commissions = await prisma.affiliateCommission.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            createdAt: true,
          },
        },
        orderItem: {
          select: {
            productName: true,
            sku: true,
            colour: true,
            size: true,
            quantity: true,
            unitPriceNGN: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return commissions.map((c) => ({
      id: c.id,
      orderId: c.orderId,
      orderNumber: c.order?.orderNumber || 'Unknown',
      orderItemId: c.orderItemId,
      productName: c.orderItem?.productName || 'Product',
      sku: c.orderItem?.sku || '',
      colour: c.orderItem?.colour || '',
      size: c.orderItem?.size || '',
      quantity: c.orderItem?.quantity || 1,
      unitPriceNGN: c.orderItem?.unitPriceNGN || 0,
      amountKobo: c.amountKobo,
      amountNGN: c.amountKobo / 100,
      status: c.status,
      eligibleAt: c.eligibleAt?.toISOString() || null,
      paidAt: c.paidAt?.toISOString() || null,
      reversedAt: c.reversedAt?.toISOString() || null,
      reversalReason: c.reversalReason || null,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  public static async getEarnings(affiliateId: string, statusFilter?: string) {
    return this.getCommissions(affiliateId, { status: statusFilter });
  }

  // ─── PAYOUTS ──────────────────────────────────────────────────────────────

  public static async requestPayout(
    affiliateId: string,
    data: { amountNGN: number; bankName: string; accountNumber: string; accountName: string }
  ) {
    const requestedKobo = Math.round(data.amountNGN * 100);
    if (!Number.isSafeInteger(requestedKobo) || requestedKobo < MIN_PAYOUT_KOBO) {
      throw new Error(`Minimum withdrawal amount is ₦${(MIN_PAYOUT_KOBO / 100).toLocaleString()}.`);
    }

    const payout = await prisma.$transaction(async (tx) => {
      const affiliate = await tx.affiliate.findUnique({ where: { id: affiliateId } });
      if (!affiliate || affiliate.status !== 'ACTIVE') {
        throw new Error('Only active affiliates can request payouts.');
      }

      const commissions = await tx.affiliateCommission.findMany({
        where: { affiliateId, status: 'AVAILABLE', payoutId: null },
        orderBy: { eligibleAt: 'asc' },
      });
      const availableKobo = commissions.reduce((sum, commission) => sum + commission.amountKobo, 0);
      if (requestedKobo > availableKobo) {
        throw new Error(`Requested amount exceeds your available balance of ₦${(availableKobo / 100).toLocaleString()}.`);
      }

      // Reserve only the commission records needed for this payout request.
      const reservedCommissionIds: string[] = [];
      let remainingKobo = requestedKobo;
      for (const commission of commissions) {
        if (commission.amountKobo <= remainingKobo) {
          reservedCommissionIds.push(commission.id);
          remainingKobo -= commission.amountKobo;
        }
        if (remainingKobo === 0) break;
      }
      if (remainingKobo !== 0) {
        throw new Error('Requested amount must match available commission increments.');
      }

      const newPayout = await tx.affiliatePayout.create({
        data: {
          affiliateId,
          amountKobo: requestedKobo,
          status: 'PENDING',
          bankName: data.bankName.trim(),
          accountNumber: data.accountNumber.trim(),
          accountName: data.accountName.trim(),
        },
      });

      // Link available commissions to this payout
      await tx.affiliateCommission.updateMany({
        where: {
          id: { in: reservedCommissionIds },
          payoutId: null,
        },
        data: {
          payoutId: newPayout.id,
        },
      });

      return newPayout;
    }, { isolationLevel: 'Serializable' });

    return {
      id: payout.id,
      amountKobo: payout.amountKobo,
      amountNGN: requestedKobo / 100,
      status: payout.status,
      bankName: payout.bankName,
      accountNumberMasked: `****${payout.accountNumber.slice(-4)}`,
      accountName: payout.accountName,
      requestedAt: payout.requestedAt.toISOString(),
    };
  }

  public static async getPayouts(affiliateId: string) {
    const payouts = await prisma.affiliatePayout.findMany({
      where: { affiliateId },
      orderBy: { requestedAt: 'desc' },
    });

    return payouts.map((p) => ({
      id: p.id,
      amountKobo: p.amountKobo,
      amountNGN: p.amountKobo / 100,
      status: p.status,
      bankName: p.bankName,
      accountNumber: p.accountNumber,
      accountNumberMasked: `****${p.accountNumber.slice(-4)}`,
      accountName: p.accountName,
      paymentReference: p.paymentReference || null,
      adminNote: p.adminNote || null,
      processedAt: p.processedAt?.toISOString() || null,
      requestedAt: p.requestedAt.toISOString(),
    }));
  }

  // ─── DASHBOARD STATS ──────────────────────────────────────────────────────

  public static async getDashboardStats(affiliateId: string) {
    const { CommissionService } = await import('./commissionService');

    const [affiliate, commissionSummary, totalClicks, totalOrders, links, recentCommissions, recentPayouts] =
      await Promise.all([
        this.getProfile(affiliateId),
        CommissionService.getCommissionSummary(affiliateId),
        prisma.affiliateClick.count({ where: { affiliateId } }),
        prisma.order.count({ where: { affiliateId } }),
        prisma.affiliateLink.findMany({
          where: { affiliateId },
          select: { clickCount: true, orderCount: true },
        }),
        this.getCommissions(affiliateId, { limit: 10 }),
        this.getPayouts(affiliateId),
      ]);

    const totalProductsSold = await prisma.affiliateCommission.count({
      where: { affiliateId },
    });

    const revenueData = await prisma.order.aggregate({
      where: { affiliateId, paymentStatus: 'PAID' },
      _sum: { totalNGN: true },
    });

    const conversionRate =
      totalClicks > 0 ? parseFloat(((totalOrders / totalClicks) * 100).toFixed(2)) : 0;

    return {
      affiliate,
      earnings: {
        pendingKobo: commissionSummary.pendingKobo,
        pendingNGN: commissionSummary.pendingKobo / 100,
        availableKobo: commissionSummary.availableKobo,
        availableNGN: commissionSummary.availableKobo / 100,
        paidKobo: commissionSummary.paidKobo,
        paidNGN: commissionSummary.paidKobo / 100,
        reversedKobo: commissionSummary.reversedKobo,
        reversedNGN: commissionSummary.reversedKobo / 100,
        totalEarnedKobo: commissionSummary.totalEarnedKobo,
        totalEarnedNGN: commissionSummary.totalEarnedKobo / 100,
      },
      metrics: {
        totalClicks,
        totalOrders,
        totalProductsSold,
        activeLinksCount: links.length,
        conversionRatePercent: conversionRate,
        averageOrderValueNGN:
          totalOrders > 0
            ? Math.round((revenueData._sum.totalNGN || 0) / totalOrders)
            : 0,
      },
      config: {
        commissionPerOrderNGN: CommissionService.getCommissionPerOrderNGN(),
        returnWindowDays: CommissionService.getReturnWindowDays(),
        attributionWindowDays: ATTRIBUTION_WINDOW_DAYS,
        minimumPayoutNGN: MIN_PAYOUT_KOBO / 100,
      },
      recentCommissions,
      recentPayouts,
      recentClicks: [],
    };
  }

  // ─── ADMIN OPERATIONS ─────────────────────────────────────────────────────

  public static async getAllAffiliatesForAdmin(options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (options?.status && options.status !== 'ALL') {
      where.status = options.status;
    }
    if (options?.search) {
      where.OR = [
        { email: { contains: options.search, mode: 'insensitive' } },
        { firstName: { contains: options.search, mode: 'insensitive' } },
        { lastName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const affiliates = await prisma.affiliate.findMany({
      where,
      include: {
        _count: {
          select: {
            links: true,
            clicks: true,
            commissions: true,
            orders: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return affiliates.map((a) => ({
      id: a.id,
      email: a.email,
      name: `${a.firstName} ${a.lastName}`.trim(),
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone,
      instagram: a.instagram,
      tiktok: a.tiktok,
      audienceSize: a.audienceSize,
      promotionChannels: a.promotionChannels,
      promotionExperience: a.promotionExperience,
      status: a.status,
      isActive: a.isActive,
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      accountName: a.accountName,
      appliedAt: a.appliedAt.toISOString(),
      approvedAt: a.approvedAt?.toISOString() || null,
      suspendedAt: a.suspendedAt?.toISOString() || null,
      rejectedAt: a.rejectedAt?.toISOString() || null,
      rejectionReason: a.rejectionReason || null,
      suspensionReason: a.suspensionReason || null,
      stats: {
        linksCount: a._count.links,
        clicksCount: a._count.clicks,
        ordersCount: a._count.orders,
        commissionsCount: a._count.commissions,
      },
    }));
  }

  public static async getAffiliateDetailForAdmin(affiliateId: string) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        links: {
          orderBy: { createdAt: 'desc' },
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            order: { select: { orderNumber: true, status: true } },
          },
        },
        payouts: {
          orderBy: { requestedAt: 'desc' },
        },
      },
    });

    if (!affiliate) return null;

    const { CommissionService } = await import('./commissionService');
    const summary = await CommissionService.getCommissionSummary(affiliateId);

    return {
      id: affiliate.id,
      email: affiliate.email,
      name: `${affiliate.firstName} ${affiliate.lastName}`.trim(),
      firstName: affiliate.firstName,
      lastName: affiliate.lastName,
      phone: affiliate.phone,
      instagram: affiliate.instagram,
      tiktok: affiliate.tiktok,
      otherSocials: affiliate.otherSocials,
      promotionChannels: affiliate.promotionChannels,
      audienceSize: affiliate.audienceSize,
      promotionExperience: affiliate.promotionExperience,
      status: affiliate.status,
      isActive: affiliate.isActive,
      bankName: affiliate.bankName,
      accountNumber: affiliate.accountNumber,
      accountName: affiliate.accountName,
      appliedAt: affiliate.appliedAt.toISOString(),
      approvedAt: affiliate.approvedAt?.toISOString() || null,
      approvedBy: affiliate.approvedBy || null,
      rejectedAt: affiliate.rejectedAt?.toISOString() || null,
      rejectedBy: affiliate.rejectedBy || null,
      rejectionReason: affiliate.rejectionReason || null,
      suspendedAt: affiliate.suspendedAt?.toISOString() || null,
      suspendedBy: affiliate.suspendedBy || null,
      suspensionReason: affiliate.suspensionReason || null,
      summary: {
        pendingNGN: summary.pendingKobo / 100,
        availableNGN: summary.availableKobo / 100,
        paidNGN: summary.paidKobo / 100,
        reversedNGN: summary.reversedKobo / 100,
        totalEarnedNGN: summary.totalEarnedKobo / 100,
      },
      links: affiliate.links,
      recentCommissions: affiliate.commissions,
      payouts: affiliate.payouts,
    };
  }

  public static async reviewApplication(
    affiliateId: string,
    action: 'APPROVE' | 'REJECT',
    adminEmail: string,
    reason?: string
  ) {
    const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
    if (!affiliate) throw new Error('Affiliate not found');

    const now = new Date();

    if (action === 'APPROVE') {
      const updated = await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: 'ACTIVE',
          isActive: true,
          approvedAt: now,
          approvedBy: adminEmail,
        },
      });
      return updated;
    } else {
      const updated = await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: 'REJECTED',
          isActive: false,
          rejectedAt: now,
          rejectedBy: adminEmail,
          rejectionReason: reason || 'Application did not meet minimum criteria',
        },
      });
      return updated;
    }
  }

  public static async updateAffiliateStatus(
    affiliateId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    adminEmail: string,
    reason?: string
  ) {
    const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
    if (!affiliate) throw new Error('Affiliate not found');

    const now = new Date();

    if (status === 'SUSPENDED') {
      const updated = await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: 'SUSPENDED',
          isActive: false,
          suspendedAt: now,
          suspendedBy: adminEmail,
          suspensionReason: reason || 'Account suspended by administrator',
        },
      });
      return updated;
    } else {
      const updated = await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: 'ACTIVE',
          isActive: true,
          suspendedAt: null,
          suspensionReason: null,
        },
      });
      return updated;
    }
  }

  public static async getAllPayoutsForAdmin(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (options?.status && options.status !== 'ALL') {
      where.status = options.status;
    }

    const payouts = await prisma.affiliatePayout.findMany({
      where,
      include: {
        affiliate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return payouts.map((p) => ({
      id: p.id,
      affiliateId: p.affiliateId,
      affiliateName: `${p.affiliate.firstName} ${p.affiliate.lastName}`.trim(),
      affiliateEmail: p.affiliate.email,
      affiliatePhone: p.affiliate.phone,
      amountKobo: p.amountKobo,
      amountNGN: p.amountKobo / 100,
      status: p.status,
      bankName: p.bankName,
      accountNumber: p.accountNumber,
      accountName: p.accountName,
      adminNote: p.adminNote,
      paymentReference: p.paymentReference,
      processedBy: p.processedBy,
      processedAt: p.processedAt?.toISOString() || null,
      requestedAt: p.requestedAt.toISOString(),
    }));
  }

  public static async processPayout(
    payoutId: string,
    action: 'PAID' | 'REJECTED' | 'APPROVED',
    adminEmail: string,
    notes?: string,
    paymentReference?: string
  ) {
    const payout = await prisma.affiliatePayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) throw new Error('Payout request not found');

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      if (action === 'PAID') {
        const updated = await tx.affiliatePayout.update({
          where: { id: payoutId },
          data: {
            status: 'PAID',
            paymentReference: paymentReference || `MANUAL-${Date.now()}`,
            adminNote: notes || 'Payout processed successfully',
            processedBy: adminEmail,
            processedAt: now,
          },
        });

        // Mark associated commissions as PAID
        await tx.affiliateCommission.updateMany({
          where: { payoutId: payout.id },
          data: {
            status: 'PAID',
            paidAt: now,
          },
        });

        return updated;
      } else if (action === 'REJECTED') {
        const updated = await tx.affiliatePayout.update({
          where: { id: payoutId },
          data: {
            status: 'REJECTED',
            adminNote: notes || 'Payout request rejected',
            processedBy: adminEmail,
            processedAt: now,
          },
        });

        // Unlink commissions so they become available again
        await tx.affiliateCommission.updateMany({
          where: { payoutId: payout.id },
          data: {
            payoutId: null,
          },
        });

        return updated;
      } else {
        const updated = await tx.affiliatePayout.update({
          where: { id: payoutId },
          data: {
            status: 'APPROVED',
            adminNote: notes || 'Payout approved, queued for disbursement',
            processedBy: adminEmail,
            processedAt: now,
          },
        });
        return updated;
      }
    });
  }
}
