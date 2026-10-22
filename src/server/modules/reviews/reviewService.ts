import { prisma, isPrismaAvailable } from '../../db/prisma';
import { dbStore, DbReview, ReviewStatusType } from '../../db/store';

export interface CreateReviewInput {
  productId: string;
  rating: number;
  reviewerDisplayName: string;
  reviewerEmail?: string;
  title?: string;
  body: string;
  // Verification helpers (checked server-side only)
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
  /**
   * Validate rating input strictly (1 to 5 integer only)
   */
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

  /**
   * Validate written review content
   */
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

  /**
   * Public Product Reviews Query (Published only, paginated, sorted)
   */
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

    const usePrisma = await isPrismaAvailable();

    if (usePrisma) {
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

        // Compute summary from all published reviews of this product
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
        console.warn('[REVIEW_SERVICE] Prisma query failed, falling back to dbStore:', err);
      }
    }

    // In-memory store fallback
    const allPublished = dbStore.getReviewsForProduct(productId, true);
    const total = allPublished.length;

    let sorted = [...allPublished];
    if (sort === 'highest') {
      sorted.sort((a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'lowest') {
      sorted.sort((a, b) => a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const startIdx = (page - 1) * limit;
    const paginated = sorted.slice(startIdx, startIdx + limit);
    const summary = dbStore.getProductRatingSummary(productId);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      reviews: paginated.map((r) => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        reviewerDisplayName: r.reviewerDisplayName,
        title: r.title,
        body: r.body,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
      })),
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Rating Summary for a single product
   */
  public static async getProductRatingSummary(productId: string): Promise<ReviewSummary> {
    const res = await this.getProductReviews(productId, { page: 1, limit: 1 });
    if (res.summary.totalReviews === 0) {
      const memSummary = dbStore.getProductRatingSummary(productId);
      if (memSummary.totalReviews > 0) {
        return memSummary;
      }
    }
    return res.summary;
  }

  /**
   * Batch Rating Summaries for product card catalog
   */
  public static async batchGetRatingSummaries(
    productIds: string[]
  ): Promise<Record<string, { averageRating: number | null; totalReviews: number }>> {
    const result: Record<string, { averageRating: number | null; totalReviews: number }> = {};
    if (!productIds || productIds.length === 0) return result;

    const usePrisma = await isPrismaAvailable();

    if (usePrisma) {
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
            const memSummary = dbStore.getProductRatingSummary(id);
            result[id] = memSummary.totalReviews > 0
              ? { averageRating: memSummary.averageRating, totalReviews: memSummary.totalReviews }
              : { averageRating: null, totalReviews: 0 };
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
        console.warn('[REVIEW_SERVICE] Batch prisma query failed, falling back to dbStore:', err);
      }
    }

    // In-memory fallback
    for (const id of productIds) {
      const summary = dbStore.getProductRatingSummary(id);
      result[id] = {
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews,
      };
    }
    return result;
  }

  /**
   * Server-Side Verified Purchase Check
   */
  private static async verifyPurchase(
    productId: string,
    customerEmail?: string,
    orderNumber?: string,
    customerId?: string
  ): Promise<{
    isVerified: boolean;
    orderId?: string;
    orderItemId?: string;
    reason?: string;
  }> {
    const normalizedEmail = customerEmail?.trim().toLowerCase();
    const cleanOrderNumber = orderNumber?.trim().toUpperCase();

    // Check if eligible order can be found in Prisma or dbStore
    const usePrisma = await isPrismaAvailable();

    if (usePrisma) {
      try {
        const orderWhere: any = {
          OR: [],
        };
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
            // Must not be cancelled, failed, returned, or refunded
            const ineligibleStatuses = ['CANCELLED', 'FAILED', 'RETURNED', 'REFUNDED'];
            if (ineligibleStatuses.includes(ord.status)) continue;

            // Must have confirmed payment
            const validPaymentStatuses = ['PAID'];
            const validOrderStatuses = ['PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
            if (!validPaymentStatuses.includes(ord.paymentStatus) && !validOrderStatuses.includes(ord.status)) {
              continue;
            }

            // Find matching item for this product
            const matchingItem = ord.items.find((item) => item.productId === productId);
            if (!matchingItem) continue;

            // Check if this order item was already reviewed
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
      } catch (err) {
        console.warn('[REVIEW_SERVICE] Prisma purchase verification failed, falling back:', err);
      }
    }

    // In-memory fallback verification
    for (const ord of dbStore.orders.values()) {
      const emailMatches = normalizedEmail && ord.customerEmail.toLowerCase() === normalizedEmail;
      const orderNumberMatches = cleanOrderNumber && ord.orderNumber.toUpperCase() === cleanOrderNumber;

      if (emailMatches || orderNumberMatches) {
        const ineligibleStatuses = ['CANCELLED', 'FAILED', 'RETURNED', 'REFUNDED'];
        if (ineligibleStatuses.includes(ord.orderStatus)) continue;

        const validPaymentStatuses = ['PAID'];
        const validOrderStatuses = ['PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
        if (!validPaymentStatuses.includes(ord.paymentStatus) && !validOrderStatuses.includes(ord.orderStatus)) {
          continue;
        }

        const matchingItem = ord.items.find((item) => item.productId === productId);
        if (!matchingItem) continue;

        // Ensure order item has not already been used for a review
        if (!dbStore.orderItemReviewIndex.has(matchingItem.id)) {
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

  /**
   * Submit a new Product Review
   */
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

    // Verify product existence
    const product = dbStore.products.get(input.productId);
    if (!product) {
      // Check Prisma
      if (await isPrismaAvailable()) {
        const dbProd = await prisma.product.findUnique({ where: { id: input.productId } });
        if (!dbProd) {
          throw new Error('The product being reviewed does not exist in our catalog.');
        }
      } else {
        throw new Error('The product being reviewed does not exist in our catalog.');
      }
    }

    // Purchase verification
    const verification = await this.verifyPurchase(
      input.productId,
      input.reviewerEmail,
      input.orderNumber,
      input.customerId
    );

    // Initial status: PENDING awaiting moderation
    const status: ReviewStatusType = 'PENDING';
    const now = new Date().toISOString();
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const usePrisma = await isPrismaAvailable();

    if (usePrisma) {
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
        console.warn('[REVIEW_SERVICE] Prisma createReview error, falling back:', err);
      }
    }

    // In-memory store fallback
    const newDbReview: DbReview = {
      id: reviewId,
      productId: input.productId,
      orderId: verification.orderId,
      orderItemId: verification.orderItemId,
      customerId: input.customerId,
      reviewerDisplayName: displayName,
      reviewerEmail: input.reviewerEmail?.trim().toLowerCase(),
      rating,
      title: cleanTitle,
      body: cleanBody,
      status,
      isVerifiedPurchase: verification.isVerified,
      createdAt: now,
      updatedAt: now,
    };

    dbStore.addReview(newDbReview);

    return {
      review: {
        id: newDbReview.id,
        productId: newDbReview.productId,
        rating: newDbReview.rating,
        reviewerDisplayName: newDbReview.reviewerDisplayName,
        title: newDbReview.title,
        body: newDbReview.body,
        isVerifiedPurchase: newDbReview.isVerifiedPurchase,
        createdAt: newDbReview.createdAt,
      },
      message: 'Thank you! Your review has been submitted for moderation and will appear once approved.',
      requiresModeration: true,
    };
  }

  /**
   * Customer Updates Own Review
   */
  public static async updateReview(
    reviewId: string,
    actor: { customerId?: string; customerEmail?: string },
    updates: { rating?: number; title?: string; body?: string }
  ): Promise<SafePublicReview> {
    const usePrisma = await isPrismaAvailable();

    if (usePrisma) {
      const existing = await prisma.productReview.findUnique({ where: { id: reviewId } });
      if (!existing) throw new Error('Review not found.');

      // Check ownership
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

      // Re-trigger moderation on edit
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

    const review = dbStore.getReview(reviewId);
    if (!review) throw new Error('Review not found.');

    const isOwner =
      (actor.customerId && review.customerId === actor.customerId) ||
      (actor.customerEmail && review.reviewerEmail?.toLowerCase() === actor.customerEmail.toLowerCase());

    if (!isOwner) {
      throw new Error('You do not have permission to modify this review.');
    }

    if (updates.rating !== undefined) {
      review.rating = this.validateRating(updates.rating);
    }
    if (updates.body !== undefined || updates.title !== undefined) {
      const { cleanTitle, cleanBody } = this.validateContent(
        updates.title !== undefined ? updates.title : review.title,
        updates.body !== undefined ? updates.body : review.body
      );
      review.title = cleanTitle;
      review.body = cleanBody;
    }

    review.status = 'PENDING';
    review.updatedAt = new Date().toISOString();

    return {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      reviewerDisplayName: review.reviewerDisplayName,
      title: review.title,
      body: review.body,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
    };
  }

  /**
   * Customer Withdraws Own Review
   */
  public static async withdrawReview(
    reviewId: string,
    actor: { customerId?: string; customerEmail?: string }
  ): Promise<{ success: boolean; message: string }> {
    const usePrisma = await isPrismaAvailable();

    if (usePrisma) {
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

    const review = dbStore.getReview(reviewId);
    if (!review) throw new Error('Review not found.');

    const isOwner =
      (actor.customerId && review.customerId === actor.customerId) ||
      (actor.customerEmail && review.reviewerEmail?.toLowerCase() === actor.customerEmail.toLowerCase());

    if (!isOwner) {
      throw new Error('You do not have permission to withdraw this review.');
    }

    review.status = 'HIDDEN';
    review.updatedAt = new Date().toISOString();

    return { success: true, message: 'Your review has been withdrawn.' };
  }

  /**
   * Admin: List all reviews with filters, pagination, and metric cards
   */
  public static async adminListReviews(options: {
    page?: number;
    limit?: number;
    status?: string;
    rating?: number;
    productId?: string;
    search?: string;
  }): Promise<{
    reviews: (DbReview & { productName?: string })[];
    metrics: {
      totalReviews: number;
      publishedCount: number;
      pendingCount: number;
      hiddenCount: number;
      rejectedCount: number;
      averagePublishedRating: number | null;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));

    const usePrisma = await isPrismaAvailable();

    if (usePrisma) {
      try {
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

        // Compute overall metrics
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
            status: r.status as ReviewStatusType,
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
      } catch (err) {
        console.warn('[REVIEW_SERVICE] Prisma admin query failed, falling back:', err);
      }
    }

    // In-memory fallback
    const all = Array.from(dbStore.reviews.values());
    let filtered = all.filter((r) => {
      if (options.status && options.status !== 'ALL' && r.status !== options.status) return false;
      if (options.rating && r.rating !== Number(options.rating)) return false;
      if (options.productId && r.productId !== options.productId) return false;
      if (options.search) {
        const s = options.search.toLowerCase();
        const matchesName = r.reviewerDisplayName.toLowerCase().includes(s);
        const matchesEmail = r.reviewerEmail?.toLowerCase().includes(s);
        const matchesBody = r.body.toLowerCase().includes(s);
        const matchesTitle = r.title?.toLowerCase().includes(s);
        if (!matchesName && !matchesEmail && !matchesBody && !matchesTitle) return false;
      }
      return true;
    });

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let publishedCount = 0;
    let pendingCount = 0;
    let hiddenCount = 0;
    let rejectedCount = 0;
    let publishedRatingSum = 0;

    for (const r of all) {
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

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      reviews: paginated.map((r) => ({
        ...r,
        productName: dbStore.products.get(r.productId)?.name || 'Product',
      })),
      metrics: {
        totalReviews: all.length,
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

  /**
   * Admin: Moderate Review (PUBLISH, HIDE, REJECT, RESTORE)
   */
  public static async adminModerateReview(
    reviewId: string,
    adminId: string,
    action: 'PUBLISH' | 'HIDE' | 'REJECT' | 'RESTORE',
    note?: string
  ): Promise<DbReview> {
    const now = new Date();
    let targetStatus: ReviewStatusType;

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

    const usePrisma = await isPrismaAvailable();

    if (usePrisma) {
      try {
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

        // Record audit log
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
          // ignore audit failure
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
          status: updated.status as ReviewStatusType,
          isVerifiedPurchase: updated.isVerifiedPurchase,
          moderatedBy: updated.moderatedBy || undefined,
          moderationNote: updated.moderationNote || undefined,
          moderatedAt: updated.moderatedAt?.toISOString(),
          publishedAt: updated.publishedAt?.toISOString(),
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('[REVIEW_SERVICE] Prisma moderation failed, falling back to dbStore:', err);
      }
    }

    // In-memory fallback
    const review = dbStore.getReview(reviewId);
    if (!review) throw new Error('Review not found.');

    review.status = targetStatus;
    review.moderatedBy = adminId;
    review.moderationNote = note;
    review.moderatedAt = now.toISOString();
    if (targetStatus === 'PUBLISHED') {
      review.publishedAt = now.toISOString();
    }
    review.updatedAt = now.toISOString();

    return review;
  }
}
