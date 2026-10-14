import { prisma, checkDatabaseHealth } from '../../db/prisma';
import { dbStore } from '../../../../../src/server/db/store';

// Cached DB availability — shared module-level flag with 30s TTL
let _dbAvailable: boolean | null = null;
let _dbAvailableCheckedAt = 0;
const DB_CACHE_TTL_MS = 30_000;

async function isDbUp(): Promise<boolean> {
  const now = Date.now();
  if (_dbAvailable !== null && now - _dbAvailableCheckedAt < DB_CACHE_TTL_MS) {
    return _dbAvailable;
  }
  const health = await checkDatabaseHealth();
  _dbAvailable = health.ok;
  _dbAvailableCheckedAt = now;
  return health.ok;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  reviewerDisplayName: string;
  reviewerEmail?: string;
  title?: string;
  body: string;
  orderNumber?: string;
  customerId?: string;
  orderAccessToken?: string;
}

export interface ReviewFilterOptions {
  page?: number;
  limit?: number;
  sort?: 'recent' | 'highest' | 'lowest';
}

export interface ReviewSummary {
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface SafePublicReview {
  id: string;
  productId: string;
  rating: number;
  reviewerDisplayName: string;
  title?: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export class ReviewService {
  public static validateRating(rating: unknown): number {
    if (rating === undefined || rating === null || rating === '') {
      throw new Error('Rating is required.');
    }
    const num = Number(rating);
    if (!Number.isInteger(num)) {
      throw new Error('Rating must be an integer between 1 and 5 stars.');
    }
    if (num < 1 || num > 5) {
      throw new Error('Rating must be between 1 and 5 stars.');
    }
    return num;
  }

  public static validateContent(title?: string, body?: string): { cleanTitle?: string; cleanBody: string } {
    if (!body || typeof body !== 'string') {
      throw new Error('A written review is required.');
    }
    const cleanBody = body.trim();
    if (cleanBody.length < 10) {
      throw new Error('Your review must be at least 10 characters.');
    }
    if (cleanBody.length > 2000) {
      throw new Error('Your review cannot exceed 2,000 characters.');
    }

    let cleanTitle: string | undefined;
    if (title && typeof title === 'string') {
      cleanTitle = title.trim();
      if (cleanTitle.length > 100) {
        throw new Error('Review title cannot exceed 100 characters.');
      }
    }

    return { cleanTitle: cleanTitle || undefined, cleanBody };
  }

  public static async getProductReviews(
    productId: string,
    options: ReviewFilterOptions = {}
  ): Promise<{
    reviews: SafePublicReview[];
    summary: ReviewSummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 10));
    const sort = options.sort || 'recent';

    if (await isDbUp()) {
      try {
        const whereClause = {
          productId,
          status: 'PUBLISHED' as const,
        };

        const total = await prisma.productReview.count({ where: whereClause });

        let orderBy: any = { createdAt: 'desc' };
        if (sort === 'highest') {
          orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
        } else if (sort === 'lowest') {
          orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
        }

        const rawReviews = await prisma.productReview.findMany({
          where: whereClause,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            productId: true,
            rating: true,
            reviewerDisplayName: true,
            title: true,
            body: true,
            isVerifiedPurchase: true,
            createdAt: true,
          },
        });

        const allPublished = await prisma.productReview.findMany({
          where: whereClause,
          select: { rating: true },
        });

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        for (const r of allPublished) {
          const rNum = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
          distribution[rNum] = (distribution[rNum] || 0) + 1;
          sum += rNum;
        }

        const averageRating =
          allPublished.length > 0 ? Number((sum / allPublished.length).toFixed(1)) : null;

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          reviews: rawReviews.map((r) => ({
            id: r.id,
            productId: r.productId,
            rating: r.rating,
            reviewerDisplayName: r.reviewerDisplayName,
            title: r.title,
            body: r.body,
            isVerifiedPurchase: r.isVerifiedPurchase,
            createdAt: r.createdAt.toISOString(),
          })),
          summary: {
            averageRating,
            totalReviews: allPublished.length,
            ratingDistribution: distribution,
          },
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
          },
        };
      } catch (err) {
        console.warn('[ReviewService] DB query failed, returning empty reviews:', (err as any)?.message);
        _dbAvailable = false;
        _dbAvailableCheckedAt = Date.now();
      }
    }

    // In-memory fallback — pull from dbStore reviews
    const memReviews = Array.from(dbStore.reviews.values())
      .filter((r) => r.productId === productId && r.status === 'PUBLISHED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = memReviews.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paged = memReviews.slice((page - 1) * limit, page * limit);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of memReviews) {
      const rNum = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
      distribution[rNum]++;
      sum += rNum;
    }
    const averageRating = total > 0 ? Number((sum / total).toFixed(1)) : null;

    return {
      reviews: paged.map((r) => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        reviewerDisplayName: r.reviewerDisplayName,
        title: r.title,
        body: r.body,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
      })),
      summary: { averageRating, totalReviews: total, ratingDistribution: distribution },
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    };
  }

  public static async getProductRatingSummary(productId: string): Promise<ReviewSummary> {
    const res = await this.getProductReviews(productId, { page: 1, limit: 1 });
    return res.summary;
  }

  public static async batchGetRatingSummaries(
    productIds: string[]
  ): Promise<Record<string, { averageRating: number | null; totalReviews: number }>> {
    const result: Record<string, { averageRating: number | null; totalReviews: number }> = {};
    if (!productIds || productIds.length === 0) return result;

    if (await isDbUp()) {
      try {
        const reviews = await prisma.productReview.findMany({
          where: {
            productId: { in: productIds },
            status: 'PUBLISHED',
          },
          select: {
            productId: true,
            rating: true,
          },
        });

        const grouped: Record<string, number[]> = {};
        for (const id of productIds) grouped[id] = [];
        for (const r of reviews) {
          if (!grouped[r.productId]) grouped[r.productId] = [];
          grouped[r.productId].push(r.rating);
        }

        for (const id of productIds) {
          const ratings = grouped[id] || [];
          if (ratings.length === 0) {
            result[id] = { averageRating: null, totalReviews: 0 };
          } else {
            const sum = ratings.reduce((acc, curr) => acc + curr, 0);
            result[id] = {
              averageRating: Number((sum / ratings.length).toFixed(1)),
              totalReviews: ratings.length,
            };
          }
        }
        return result;
      } catch (err) {
        console.warn('[ReviewService] batchGetRatingSummaries DB failed, falling back to in-memory:', (err as any)?.message);
        _dbAvailable = false;
        _dbAvailableCheckedAt = Date.now();
      }
    }

    // In-memory fallback — read from dbStore reviews
    for (const id of productIds) {
      const memReviews = Array.from(dbStore.reviews.values()).filter(
        (r) => r.productId === id && r.status === 'PUBLISHED'
      );
      if (memReviews.length === 0) {
        result[id] = { averageRating: null, totalReviews: 0 };
      } else {
        const sum = memReviews.reduce((acc, r) => acc + r.rating, 0);
        result[id] = {
          averageRating: Number((sum / memReviews.length).toFixed(1)),
          totalReviews: memReviews.length,
        };
      }
    }
    return result;
  }

  private static async verifyPurchase(
    productId: string,
    customerEmail?: string,
    orderNumber?: string,
    customerId?: string
  ): Promise<{
    isVerified: boolean;
    orderId?: string;
    orderItemId?: string;
  }> {
    const normalizedEmail = customerEmail?.trim().toLowerCase();
    const cleanOrderNumber = orderNumber?.trim().toUpperCase();

    const orderWhere: any = { OR: [] };
    if (cleanOrderNumber) orderWhere.OR.push({ orderNumber: cleanOrderNumber });
    if (normalizedEmail) orderWhere.OR.push({ customerEmail: normalizedEmail });
    if (customerId) orderWhere.OR.push({ customerId });

    if (orderWhere.OR.length > 0) {
      const candidateOrders = await prisma.order.findMany({
        where: orderWhere,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const ord of candidateOrders) {
        const ineligibleStatuses = ['CANCELLED', 'FAILED', 'RETURNED', 'REFUNDED'];
        if (ineligibleStatuses.includes(ord.status)) continue;

        const validPaymentStatuses = ['PAID'];
        const validOrderStatuses = ['PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
        if (!validPaymentStatuses.includes(ord.paymentStatus) && !validOrderStatuses.includes(ord.status)) {
          continue;
        }

        const matchingItem = ord.items.find((item) => item.productId === productId);
        if (!matchingItem) continue;

        const existingReview = await prisma.productReview.findUnique({
          where: { orderItemId: matchingItem.id },
        });

        if (!existingReview) {
          return {
            isVerified: true,
            orderId: ord.id,
            orderItemId: matchingItem.id,
          };
        }
      }
    }

    return { isVerified: false };
  }

  public static async createReview(
    input: CreateReviewInput
  ): Promise<{ review: SafePublicReview; message: string; requiresModeration: boolean }> {
    if (!input.productId) {
      throw new Error('Valid product identifier is required.');
    }

    const rating = this.validateRating(input.rating);
    const { cleanTitle, cleanBody } = this.validateContent(input.title, input.body);

    const displayName = (input.reviewerDisplayName || '').trim();
    if (!displayName || displayName.length < 2) {
      throw new Error('Please provide your name or display nickname (at least 2 characters).');
    }
    if (displayName.length > 50) {
      throw new Error('Display name cannot exceed 50 characters.');
    }

    const dbProd = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!dbProd) {
      throw new Error('The product being reviewed does not exist in our catalog.');
    }

    const verification = await this.verifyPurchase(
      input.productId,
      input.reviewerEmail,
      input.orderNumber,
      input.customerId
    );

    const status = 'PENDING';
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const created = await prisma.productReview.create({
        data: {
          id: reviewId,
          productId: input.productId,
          orderId: verification.orderId || null,
          orderItemId: verification.orderItemId || null,
          customerId: input.customerId || null,
          reviewerDisplayName: displayName,
          reviewerEmail: input.reviewerEmail?.trim().toLowerCase() || null,
          rating,
          title: cleanTitle || null,
          body: cleanBody,
          status,
          isVerifiedPurchase: verification.isVerified,
        },
      });

      return {
        review: {
          id: created.id,
          productId: created.productId,
          rating: created.rating,
          reviewerDisplayName: created.reviewerDisplayName,
          title: created.title,
          body: created.body,
          isVerifiedPurchase: created.isVerifiedPurchase,
          createdAt: created.createdAt.toISOString(),
        },
        message: 'Thank you! Your review has been submitted for moderation and will appear once approved.',
        requiresModeration: true,
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new Error('A review has already been submitted for this purchase item.');
      }
      throw err;
    }
  }

  public static async updateReview(
    reviewId: string,
    actor: { customerId?: string; customerEmail?: string },
    updates: { rating?: number; title?: string; body?: string }
  ): Promise<SafePublicReview> {
    const existing = await prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!existing) throw new Error('Review not found.');

    const isOwner =
      (actor.customerId && existing.customerId === actor.customerId) ||
      (actor.customerEmail && existing.reviewerEmail?.toLowerCase() === actor.customerEmail.toLowerCase());

    if (!isOwner) {
      throw new Error('You do not have permission to modify this review.');
    }

    const dataToUpdate: any = { updatedAt: new Date() };

    if (updates.rating !== undefined) {
      dataToUpdate.rating = this.validateRating(updates.rating);
    }
    if (updates.body !== undefined || updates.title !== undefined) {
      const { cleanTitle, cleanBody } = this.validateContent(
        updates.title !== undefined ? updates.title : existing.title || undefined,
        updates.body !== undefined ? updates.body : existing.body
      );
      dataToUpdate.title = cleanTitle || null;
      dataToUpdate.body = cleanBody;
    }

    dataToUpdate.status = 'PENDING';

    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: dataToUpdate,
    });

    return {
      id: updated.id,
      productId: updated.productId,
      rating: updated.rating,
      reviewerDisplayName: updated.reviewerDisplayName,
      title: updated.title,
      body: updated.body,
      isVerifiedPurchase: updated.isVerifiedPurchase,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  public static async withdrawReview(
    reviewId: string,
    actor: { customerId?: string; customerEmail?: string }
  ): Promise<{ success: boolean; message: string }> {
    const existing = await prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!existing) throw new Error('Review not found.');

    const isOwner =
      (actor.customerId && existing.customerId === actor.customerId) ||
      (actor.customerEmail && existing.reviewerEmail?.toLowerCase() === actor.customerEmail.toLowerCase());

    if (!isOwner) {
      throw new Error('You do not have permission to withdraw this review.');
    }

    await prisma.productReview.update({
      where: { id: reviewId },
      data: { status: 'HIDDEN' },
    });

    return { success: true, message: 'Your review has been withdrawn.' };
  }

  public static async adminListReviews(options: {
    page?: number;
    limit?: number;
    status?: string;
    rating?: number;
    productId?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));

    const where: any = {};
    if (options.status && options.status !== 'ALL') {
      where.status = options.status;
    }
    if (options.rating) {
      where.rating = Number(options.rating);
    }
    if (options.productId) {
      where.productId = options.productId;
    }
    if (options.search) {
      const s = options.search.trim();
      where.OR = [
        { reviewerDisplayName: { contains: s, mode: 'insensitive' } },
        { reviewerEmail: { contains: s, mode: 'insensitive' } },
        { body: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.productReview.count({ where });

    const rawList = await prisma.productReview.findMany({
      where,
      include: {
        product: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const allReviews = await prisma.productReview.findMany({
      select: { status: true, rating: true },
    });

    let publishedCount = 0;
    let pendingCount = 0;
    let hiddenCount = 0;
    let rejectedCount = 0;
    let publishedRatingSum = 0;

    for (const r of allReviews) {
      if (r.status === 'PUBLISHED') {
        publishedCount++;
        publishedRatingSum += r.rating;
      } else if (r.status === 'PENDING') {
        pendingCount++;
      } else if (r.status === 'HIDDEN') {
        hiddenCount++;
      } else if (r.status === 'REJECTED') {
        rejectedCount++;
      }
    }

    const averagePublishedRating =
      publishedCount > 0 ? Number((publishedRatingSum / publishedCount).toFixed(1)) : null;

    return {
      reviews: rawList.map((r) => ({
        id: r.id,
        productId: r.productId,
        orderId: r.orderId || undefined,
        orderItemId: r.orderItemId || undefined,
        customerId: r.customerId || undefined,
        reviewerDisplayName: r.reviewerDisplayName,
        reviewerEmail: r.reviewerEmail || undefined,
        rating: r.rating,
        title: r.title || undefined,
        body: r.body,
        status: r.status,
        isVerifiedPurchase: r.isVerifiedPurchase,
        moderatedBy: r.moderatedBy || undefined,
        moderationNote: r.moderationNote || undefined,
        moderatedAt: r.moderatedAt?.toISOString(),
        publishedAt: r.publishedAt?.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        productName: r.product?.name,
      })),
      metrics: {
        totalReviews: allReviews.length,
        publishedCount,
        pendingCount,
        hiddenCount,
        rejectedCount,
        averagePublishedRating,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public static async adminModerateReview(
    reviewId: string,
    adminId: string,
    action: 'PUBLISH' | 'HIDE' | 'REJECT' | 'RESTORE',
    note?: string
  ) {
    const now = new Date();
    let targetStatus: any;

    switch (action) {
      case 'PUBLISH':
      case 'RESTORE':
        targetStatus = 'PUBLISHED';
        break;
      case 'HIDE':
        targetStatus = 'HIDDEN';
        break;
      case 'REJECT':
        targetStatus = 'REJECTED';
        break;
      default:
        throw new Error(`Invalid moderation action: ${action}`);
    }

    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        status: targetStatus,
        moderatedBy: adminId,
        moderationNote: note || null,
        moderatedAt: now,
        publishedAt: targetStatus === 'PUBLISHED' ? now : undefined,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          adminId,
          action: `REVIEW_${action}`,
          resourceType: 'PRODUCT',
          resourceId: updated.productId,
          newValue: JSON.stringify({ reviewId, status: targetStatus, note }),
        },
      });
    } catch {
      // ignore
    }

    return {
      id: updated.id,
      productId: updated.productId,
      orderId: updated.orderId || undefined,
      orderItemId: updated.orderItemId || undefined,
      customerId: updated.customerId || undefined,
      reviewerDisplayName: updated.reviewerDisplayName,
      reviewerEmail: updated.reviewerEmail || undefined,
      rating: updated.rating,
      title: updated.title || undefined,
      body: updated.body,
      status: updated.status,
      isVerifiedPurchase: updated.isVerifiedPurchase,
      moderatedBy: updated.moderatedBy || undefined,
      moderationNote: updated.moderationNote || undefined,
      moderatedAt: updated.moderatedAt?.toISOString(),
      publishedAt: updated.publishedAt?.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
