import { describe, it, expect, beforeEach } from 'vitest';
import { ReviewService } from '../src/server/modules/reviews/reviewService';
import { dbStore } from '../src/server/db/store';

describe('PIERCYN V1 Product Rating and Review System', () => {
  beforeEach(() => {
    dbStore.seedFromCatalog();
  });

  describe('1. Rating Validation', () => {
    it('accepts valid 1-star through 5-star integer ratings', () => {
      expect(ReviewService.validateRating(1)).toBe(1);
      expect(ReviewService.validateRating(3)).toBe(3);
      expect(ReviewService.validateRating(5)).toBe(5);
      expect(ReviewService.validateRating('4')).toBe(4);
    });

    it('rejects ratings below 1 and above 5', () => {
      expect(() => ReviewService.validateRating(0)).toThrow('Rating must be between 1 and 5 stars.');
      expect(() => ReviewService.validateRating(-1)).toThrow('Rating must be between 1 and 5 stars.');
      expect(() => ReviewService.validateRating(6)).toThrow('Rating must be between 1 and 5 stars.');
    });

    it('rejects decimal ratings submitted by users', () => {
      expect(() => ReviewService.validateRating(4.5)).toThrow('Rating must be an integer between 1 and 5 stars.');
      expect(() => ReviewService.validateRating(3.2)).toThrow('Rating must be an integer between 1 and 5 stars.');
    });

    it('rejects missing or empty ratings', () => {
      expect(() => ReviewService.validateRating(undefined)).toThrow('Rating is required.');
      expect(() => ReviewService.validateRating(null)).toThrow('Rating is required.');
      expect(() => ReviewService.validateRating('')).toThrow('Rating is required.');
    });

    it('validates written review content length and title limits', () => {
      expect(() => ReviewService.validateContent('Title', 'Too short')).toThrow(
        'Your review must be at least 10 characters.'
      );
      expect(() => ReviewService.validateContent('A'.repeat(105), 'Valid body text here exceeding ten chars')).toThrow(
        'Review title cannot exceed 100 characters.'
      );
      expect(() => ReviewService.validateContent('Title', 'B'.repeat(2005))).toThrow(
        'Your review cannot exceed 2,000 characters.'
      );

      const valid = ReviewService.validateContent('Great Fit', 'The heavyweight cotton hangs perfectly on shoulders.');
      expect(valid.cleanTitle).toBe('Great Fit');
      expect(valid.cleanBody).toBe('The heavyweight cotton hangs perfectly on shoulders.');
    });
  });

  describe('2. Review Submission and Verified Purchase Logic', () => {
    it('submits a review with initial PENDING status awaiting moderation', async () => {
      const allProds = Array.from(dbStore.products.values());
      const testProd = allProds[0];

      const res = await ReviewService.createReview({
        productId: testProd.id,
        rating: 5,
        reviewerDisplayName: 'Adebayo T.',
        reviewerEmail: 'adebayo.t@example.com',
        title: 'Outstanding quality',
        body: 'The fabric weight and stitching are world class. Fits boxy and relaxed.',
      });

      expect(res.review.id).toBeDefined();
      expect(res.review.rating).toBe(5);
      expect(res.review.reviewerDisplayName).toBe('Adebayo T.');
      expect(res.requiresModeration).toBe(true);

      // Verify it is stored as PENDING
      const stored = dbStore.getReview(res.review.id);
      expect(stored?.status).toBe('PENDING');
      expect(stored?.isVerifiedPurchase).toBe(false);
    });

    it('automatically grants verified purchase badge when customer email matches a delivered order containing the product', async () => {
      const allProds = Array.from(dbStore.products.values());
      const firstProd = allProds[0];

      const testOrderId = 'ord-test-delivered-1';
      const testOrderItemId = 'item-test-delivered-1';
      dbStore.orders.set(testOrderId, {
        id: testOrderId,
        orderNumber: 'PCY-TEST-01',
        customerName: 'Chuka Ekwueme',
        customerEmail: 'chuka.ekwueme@gmail.com',
        customerPhone: '+2348033112244',
        shippingAddressLine: '42 Adeola Odeku Street',
        shippingCity: 'Victoria Island',
        shippingState: 'Lagos State',
        shippingCountry: 'Nigeria',
        subtotalNGN: firstProd.priceNGN,
        deliveryFeeNGN: 0,
        discountNGN: 0,
        totalNGN: firstProd.priceNGN,
        currency: 'NGN',
        shippingMethodKey: 'lagos',
        shippingMethodName: 'Lagos Atelier Dispatch',
        paymentMethod: 'Paystack Card',
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
        paidAt: new Date().toISOString(),
        timeline: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: testOrderItemId,
            orderId: testOrderId,
            productId: firstProd.id,
            productName: firstProd.name,
            sku: 'PCY-TEE-01',
            category: 'TEES',
            colour: 'Pitch Black',
            size: 'M',
            unitPriceNGN: firstProd.priceNGN,
            costPriceNGN: 0,
            totalPriceNGN: firstProd.priceNGN,
            image: firstProd.images[0] || '',
            quantity: 1,
            createdAt: new Date().toISOString(),
          },
        ],
      });
      dbStore.orderNumberIndex.set('PCY-TEST-01', testOrderId);

      const res = await ReviewService.createReview({
        productId: firstProd.id,
        rating: 5,
        reviewerDisplayName: 'Chuka Ekwueme',
        reviewerEmail: 'chuka.ekwueme@gmail.com',
        orderNumber: 'PCY-TEST-01',
        title: 'Verified owner feedback',
        body: 'I received this yesterday in VI. The fit and fabric quality are stellar.',
      });

      expect(res.review.isVerifiedPurchase).toBe(true);
      const stored = dbStore.getReview(res.review.id);
      expect(stored?.isVerifiedPurchase).toBe(true);
      expect(stored?.orderId).toBe(testOrderId);
      expect(stored?.orderItemId).toBe(testOrderItemId);
    });

    it('prevents duplicate reviews for the same order item', async () => {
      const allProds = Array.from(dbStore.products.values());
      const firstProd = allProds[0];

      // Second review attempt for the same order item
      const res = await ReviewService.createReview({
        productId: firstProd.id,
        rating: 4,
        reviewerDisplayName: 'Chuka Again',
        reviewerEmail: 'chuka.ekwueme@gmail.com',
        orderNumber: 'PCY-TEST-01',
        title: 'Second review attempt',
        body: 'Trying to review the exact same purchased tee a second time.',
      });

      // The order item was already used, so duplicate verified badge is denied
      expect(res.review.isVerifiedPurchase).toBe(false);
    });

    it('rejects review submission for a nonexistent product ID', async () => {
      await expect(
        ReviewService.createReview({
          productId: 'non-existent-product-id-12345',
          rating: 5,
          reviewerDisplayName: 'Ghost Reviewer',
          body: 'This product definitely does not exist in the catalog.',
        })
      ).rejects.toThrow('The product being reviewed does not exist in our catalog.');
    });
  });

  describe('3. Review Ownership and Permissions', () => {
    it('allows a customer to update their own review', async () => {
      const allProds = Array.from(dbStore.products.values());
      const testProd = allProds[0];

      const created = await ReviewService.createReview({
        productId: testProd.id,
        rating: 4,
        reviewerDisplayName: 'Original Reviewer',
        reviewerEmail: 'reviewer@atelier.ng',
        title: 'Initial Impression',
        body: 'Decent heavyweight tee, waiting to see how it washes.',
      });

      const updated = await ReviewService.updateReview(
        created.review.id,
        { customerEmail: 'reviewer@atelier.ng' },
        {
          rating: 5,
          title: 'Updated: Excellent Durability',
          body: 'Washed three times with cold water. No shrinkage, collar intact.',
        }
      );

      expect(updated.rating).toBe(5);
      expect(updated.title).toBe('Updated: Excellent Durability');
      expect(updated.body).toContain('Washed three times');

      // Stored review resets to PENDING for moderation re-approval
      const stored = dbStore.getReview(created.review.id);
      expect(stored?.status).toBe('PENDING');
    });

    it('denies update request from a different customer', async () => {
      const allProds = Array.from(dbStore.products.values());
      const testProd = allProds[0];

      const created = await ReviewService.createReview({
        productId: testProd.id,
        rating: 4,
        reviewerDisplayName: 'Owner User',
        reviewerEmail: 'realowner@atelier.ng',
        body: 'Original genuine feedback from real owner.',
      });

      await expect(
        ReviewService.updateReview(
          created.review.id,
          { customerEmail: 'attacker@hacker.io' },
          { rating: 1, body: 'Malicious modification attempt.' }
        )
      ).rejects.toThrow('You do not have permission to modify this review.');
    });

    it('allows a customer to withdraw their own review', async () => {
      const allProds = Array.from(dbStore.products.values());
      const testProd = allProds[0];

      const created = await ReviewService.createReview({
        productId: testProd.id,
        rating: 4,
        reviewerDisplayName: 'Withdrawing Customer',
        reviewerEmail: 'customer@piercyn.ng',
        body: 'I will be withdrawing this review shortly.',
      });

      const res = await ReviewService.withdrawReview(created.review.id, {
        customerEmail: 'customer@piercyn.ng',
      });

      expect(res.success).toBe(true);
      const stored = dbStore.getReview(created.review.id);
      expect(stored?.status).toBe('HIDDEN');
    });
  });

  describe('4. Moderation Lifecycle and Visibility', () => {
    it('excludes PENDING, HIDDEN, and REJECTED reviews from public queries', async () => {
      const allProds = Array.from(dbStore.products.values());
      const testProd = allProds[0];

      const pubRes = await ReviewService.getProductReviews(testProd.id);
      // All reviews returned must have status PUBLISHED
      for (const r of pubRes.reviews) {
        const stored = dbStore.getReview(r.id);
        expect(stored?.status).toBe('PUBLISHED');
      }

      // Check rev-init-5 which was seeded with PENDING status
      const hasPendingInPublic = pubRes.reviews.some((r) => r.id === 'rev-init-5');
      expect(hasPendingInPublic).toBe(false);
    });

    it('allows admin to publish, hide, reject, and restore reviews', async () => {
      // Approve the pending review rev-init-5
      const approved = await ReviewService.adminModerateReview('rev-init-5', 'admin-user-1', 'PUBLISH', 'Approved by admin');
      expect(approved.status).toBe('PUBLISHED');
      expect(approved.moderatedBy).toBe('admin-user-1');
      expect(approved.publishedAt).toBeDefined();

      // Now rev-init-5 appears in public reviews
      const allProds = Array.from(dbStore.products.values());
      const firstProd = allProds[0];
      const afterApprove = await ReviewService.getProductReviews(firstProd.id);
      expect(afterApprove.reviews.some((r) => r.id === 'rev-init-5')).toBe(true);

      // Admin hides review
      const hidden = await ReviewService.adminModerateReview('rev-init-5', 'admin-user-1', 'HIDE', 'Temporarily hidden');
      expect(hidden.status).toBe('HIDDEN');

      const afterHide = await ReviewService.getProductReviews(firstProd.id);
      expect(afterHide.reviews.some((r) => r.id === 'rev-init-5')).toBe(false);

      // Admin restores review
      const restored = await ReviewService.adminModerateReview('rev-init-5', 'admin-user-1', 'RESTORE', 'Restored after review');
      expect(restored.status).toBe('PUBLISHED');

      const afterRestore = await ReviewService.getProductReviews(firstProd.id);
      expect(afterRestore.reviews.some((r) => r.id === 'rev-init-5')).toBe(true);
    });
  });

  describe('5. Rating Aggregations and Math Correctness', () => {
    it('accurately calculates average rating and star distribution for published reviews', async () => {
      const allProds = Array.from(dbStore.products.values());
      const firstProd = allProds[0];

      // In seeded catalog: firstProd has 3 published reviews (5 stars, 5 stars, 4 stars)
      // Average: (5 + 5 + 4) / 3 = 14 / 3 = 4.666... => 4.7
      const summary = await ReviewService.getProductRatingSummary(firstProd.id);

      expect(summary.totalReviews).toBe(3);
      expect(summary.averageRating).toBe(4.7);
      expect(summary.ratingDistribution[5]).toBe(2);
      expect(summary.ratingDistribution[4]).toBe(1);
      expect(summary.ratingDistribution[3]).toBe(0);
      expect(summary.ratingDistribution[2]).toBe(0);
      expect(summary.ratingDistribution[1]).toBe(0);
    });

    it('returns valid empty state when a product has zero published reviews', async () => {
      const allProds = Array.from(dbStore.products.values());
      // Last product has no reviews seeded
      const emptyProd = allProds[allProds.length - 1];

      const summary = await ReviewService.getProductRatingSummary(emptyProd.id);

      expect(summary.totalReviews).toBe(0);
      expect(summary.averageRating).toBeNull();
      expect(summary.ratingDistribution[5]).toBe(0);
      expect(summary.ratingDistribution[1]).toBe(0);
    });

    it('efficiently batch aggregates ratings for catalog product cards', async () => {
      const allProds = Array.from(dbStore.products.values());
      const prodIds = [allProds[0].id, allProds[1].id, allProds[allProds.length - 1].id];

      const batch = await ReviewService.batchGetRatingSummaries(prodIds);

      expect(batch[allProds[0].id]).toBeDefined();
      expect(batch[allProds[0].id].totalReviews).toBe(3);
      expect(batch[allProds[0].id].averageRating).toBe(4.7);

      expect(batch[allProds[1].id]).toBeDefined();
      expect(batch[allProds[1].id].totalReviews).toBe(1);
      expect(batch[allProds[1].id].averageRating).toBe(5);

      expect(batch[allProds[allProds.length - 1].id]).toBeDefined();
      expect(batch[allProds[allProds.length - 1].id].totalReviews).toBe(0);
      expect(batch[allProds[allProds.length - 1].id].averageRating).toBeNull();
    });
  });
});
