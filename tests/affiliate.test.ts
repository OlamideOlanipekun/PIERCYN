import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server/app';
import { prisma } from '../src/server/db/prisma';
import { CommissionService } from '../src/server/modules/affiliate/commissionService';
import { AffiliateService } from '../src/server/modules/affiliate/affiliateService';

describe('PIERCYN Production Affiliate & Creator System', () => {
  let adminToken: string;
  let testAffiliateEmail = `affiliate_${Date.now()}@piercyn.com`;
  let testAffiliateId: string;
  let testAffiliateToken: string;
  let referralCode: string;
  let linkId: string;
  let testSessionId = `sess_aff_${Date.now()}`;

  beforeAll(async () => {
    // Seed in-memory store
    const { dbStore } = await import('../src/server/db/store');
    dbStore.seedFromCatalog();

    // 1. Authenticate as Admin
    const adminLoginRes = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@piercyn.com',
        password: 'piercynAdmin2026',
      });

    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.data.token;
  });

  describe('1. Affiliate Application & Status Lifecycle', () => {
    it('submits a new creator/affiliate application with PENDING status', async () => {
      const applyRes = await request(app)
        .post('/api/affiliate/apply')
        .send({
          email: testAffiliateEmail,
          password: 'CreatorPass2026!',
          firstName: 'Kelvin',
          lastName: 'Adeniyi',
          phone: '+2348012345678',
          instagram: '@kelvin_style',
          tiktok: '@kelvintees',
          audienceSize: '10k-50k',
          promotionChannels: 'Instagram Reels, TikTok fashion hauls',
          promotionExperience: '3 years promoting streetwear',
          agreedToTerms: true,
        });

      expect(applyRes.status).toBe(201);
      expect(applyRes.body.success).toBe(true);
      expect(applyRes.body.data.affiliate.status).toBe('PENDING');
      expect(applyRes.body.data.affiliate.email).toBe(testAffiliateEmail.toLowerCase());
      
      testAffiliateId = applyRes.body.data.affiliate.id;
      testAffiliateToken = applyRes.body.data.token;
    });

    it('rejects duplicate application with the same email', async () => {
      const dupRes = await request(app)
        .post('/api/affiliate/apply')
        .send({
          email: testAffiliateEmail,
          password: 'AnotherPassword!',
          firstName: 'Kelvin',
          lastName: 'Adeniyi',
          phone: '+2348012345678',
          agreedToTerms: true,
        });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.success).toBe(false);
    });

    it('prevents PENDING affiliate from accessing protected active portal endpoints', async () => {
      const dashRes = await request(app)
        .get('/api/affiliate/dashboard')
        .set('Authorization', `Bearer ${testAffiliateToken}`);

      // Pending affiliate cannot view active dashboard
      expect(dashRes.status).toBe(403);
      expect(dashRes.body.error).toMatch(/pending review|not active/i);
    });

    it('allows Admin to review and APPROVE the applicant (PENDING -> ACTIVE)', async () => {
      const approveRes = await request(app)
        .post(`/api/admin/affiliates/${testAffiliateId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'APPROVE',
          adminNotes: 'Strong fashion portfolio approved for launch',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.status).toBe('ACTIVE');
      expect(approveRes.body.data.isActive).toBe(true);
    });
  });

  describe('2. Affiliate Authentication & Profile Management', () => {
    it('authenticates ACTIVE affiliate and returns secure profile token', async () => {
      const loginRes = await request(app)
        .post('/api/affiliate/login')
        .send({
          email: testAffiliateEmail,
          password: 'CreatorPass2026!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.affiliate.status).toBe('ACTIVE');
      testAffiliateToken = loginRes.body.data.token;
    });

    it('allows affiliate to update payout banking details', async () => {
      const updateRes = await request(app)
        .put('/api/affiliate/profile')
        .set('Authorization', `Bearer ${testAffiliateToken}`)
        .send({
          bankName: 'Access Bank',
          accountNumber: '0123456789',
          accountName: 'Kelvin Adeniyi',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.bankName).toBe('Access Bank');
      expect(updateRes.body.data.accountNumber).toBe('0123456789');
    });
  });

  describe('3. Affiliate Link Generation & Destination Validation', () => {
    it('creates a personalized collection referral link with a unique code', async () => {
      const linkRes = await request(app)
        .post('/api/affiliate/links')
        .set('Authorization', `Bearer ${testAffiliateToken}`)
        .send({
          name: 'Kelvin December Tees',
          destination: '/collections/mens-tshirts',
          destinationType: 'collection',
        });

      expect(linkRes.status).toBe(201);
      expect(linkRes.body.success).toBe(true);
      expect(linkRes.body.data.referralCode).toBeDefined();
      expect(linkRes.body.data.referralCode.length).toBeGreaterThanOrEqual(4);
      expect(linkRes.body.data.destination).toBe('/collections/mens-tshirts');

      referralCode = linkRes.body.data.referralCode;
      linkId = linkRes.body.data.id;
    });

    it('rejects invalid link destination not starting with /', async () => {
      const badLinkRes = await request(app)
        .post('/api/affiliate/links')
        .set('Authorization', `Bearer ${testAffiliateToken}`)
        .send({
          name: 'Invalid Destination Link',
          destination: 'https://external-phishing-site.com',
        });

      expect(badLinkRes.status).toBe(400);
      expect(badLinkRes.body.success).toBe(false);
    });
  });

  describe('4. Click Attribution Engine & 30-Day Window', () => {
    it('tracks incoming click with ?ref=CODE and persists session attribution', async () => {
      const clickRes = await request(app)
        .post('/api/affiliate/track-click')
        .send({
          code: referralCode,
          sessionId: testSessionId,
          landingPage: `/collections/mens-tshirts?ref=${referralCode}`,
          referrer: 'https://instagram.com/kelvin_style',
        });

      expect(clickRes.status).toBe(200);
      expect(clickRes.body.success).toBe(true);
      expect(clickRes.body.data.attribution).toBeDefined();
      expect(clickRes.body.data.attribution.referralCode).toBe(referralCode);
      expect(clickRes.body.data.attribution.affiliateId).toBe(testAffiliateId);
    });

    it('resolves attribution accurately during checkout quote and order placement', async () => {
      const resolved = await AffiliateService.resolveAttribution(testSessionId);
      expect(resolved).toBeDefined();
      expect(resolved?.affiliateId).toBe(testAffiliateId);
      expect(resolved?.referralCode).toBe(referralCode);
    });

    it('respects LAST VALID CLICK WINS when a customer clicks a newer affiliate link', async () => {
      // Create second affiliate
      const secondEmail = `creator_second_${Date.now()}@piercyn.com`;
      const app2 = await request(app)
        .post('/api/affiliate/apply')
        .send({
          email: secondEmail,
          password: 'Password123!',
          firstName: 'Bimbo',
          lastName: 'Cole',
          phone: '+2348099887766',
          agreedToTerms: true,
        });

      const aff2Id = app2.body.data.affiliate.id;
      // Admin approves second affiliate
      await request(app)
        .post(`/api/admin/affiliates/${aff2Id}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'APPROVE' });

      // Second affiliate creates link
      const aff2Login = await request(app)
        .post('/api/affiliate/login')
        .send({ email: secondEmail, password: 'Password123!' });
      
      const aff2Token = aff2Login.body.data.token;
      const link2Res = await request(app)
        .post('/api/affiliate/links')
        .set('Authorization', `Bearer ${aff2Token}`)
        .send({ name: 'Bimbo Hoodies', destination: '/collections/hoodies' });

      const code2 = link2Res.body.data.referralCode;

      // Track click for same session with second affiliate
      await request(app)
        .post('/api/affiliate/track-click')
        .send({
          code: code2,
          sessionId: testSessionId,
          landingPage: `/collections/hoodies?ref=${code2}`,
        });

      // Verification: Second affiliate now owns the attribution for this session
      const resolvedNew = await AffiliateService.resolveAttribution(testSessionId);
      expect(resolvedNew?.affiliateId).toBe(aff2Id);
      expect(resolvedNew?.referralCode).toBe(code2);

      // Re-click Kelvin's link so Kelvin gets attribution for upcoming order tests
      await request(app)
        .post('/api/affiliate/track-click')
        .send({
          code: referralCode,
          sessionId: testSessionId,
          landingPage: `/collections/mens-tshirts?ref=${referralCode}`,
        });
    });
  });

  describe('5. Order Attribution, Payment & Delivery-Based Commission Flow', () => {
    let createdOrderNumber: string;
    let createdOrderId: string;
    let itemQuantity = 5; // 5 qualifying products = 5 * ₦500 = ₦2,500 commission

    it('places an order snapshotting the affiliate attribution permanently onto the Order', async () => {
      const prodRes = await request(app).get('/api/products');
      const firstProduct = prodRes.body.data[0];
      const variant = firstProduct?.variants?.[0];
      expect(variant).toBeDefined();

      const orderRes = await request(app)
        .post('/api/orders')
        .set('x-session-id', testSessionId)
        .send({
          customer: {
            fullName: 'Tunde Bakare',
            email: 'tunde.shopper@gmail.com',
            phone: '+2348033445566',
            state: 'Lagos',
            city: 'Lekki',
            address: '10 Admiralty Road, Lekki Phase 1',
          },
          shippingRegion: 'lagos',
          paymentMethod: 'paystack',
          items: [{ variantId: variant.id, quantity: itemQuantity }],
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body.success).toBe(true);
      expect(orderRes.body.data.affiliateId).toBe(testAffiliateId);

      createdOrderNumber = orderRes.body.data.orderNumber;
      createdOrderId = orderRes.body.data.id;
    });

    it('creates NO commission before payment is verified', async () => {
      const commissions = await prisma.affiliateCommission.findMany({
        where: { orderId: createdOrderId },
      });
      expect(commissions.length).toBe(0);
    });

    it('processes ₦500 per delivered product (5 × ₦500 = ₦2,500) once payment is verified', async () => {
      // Confirm payment
      await request(app)
        .post('/api/payments/verify')
        .send({ reference: createdOrderNumber });

      const commissions = await prisma.affiliateCommission.findMany({
        where: { orderId: createdOrderId },
      });

      expect(commissions.length).toBeGreaterThan(0);
      const totalKobo = commissions.reduce((sum, c) => sum + c.amountKobo, 0);
      // 5 items * 50,000 kobo (₦500) = 250,000 kobo (₦2,500)
      expect(totalKobo).toBe(itemQuantity * 50000);
      expect(commissions[0].status).toBe('PENDING');
    });

    it('is strictly IDEMPOTENT — repeated payment/webhook confirmation never creates duplicate commissions', async () => {
      await CommissionService.processOrderCommission(createdOrderId);
      await CommissionService.processOrderCommission(createdOrderId);

      const commissions = await prisma.affiliateCommission.findMany({
        where: { orderId: createdOrderId },
      });

      const totalKobo = commissions.reduce((sum, c) => sum + c.amountKobo, 0);
      expect(totalKobo).toBe(itemQuantity * 50000);
    });

    it('transitions commission from PENDING to AVAILABLE when order is DELIVERED', async () => {
      // Progress order through admin lifecycle: PAID -> PROCESSING -> PACKED -> SHIPPED -> DELIVERED
      await request(app)
        .patch(`/api/admin/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      await request(app)
        .patch(`/api/admin/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PACKED' });

      await request(app)
        .patch(`/api/admin/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SHIPPED' });

      const delivRes = await request(app)
        .patch(`/api/admin/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DELIVERED' });

      expect(delivRes.status).toBe(200);

      const commissions = await prisma.affiliateCommission.findMany({
        where: { orderId: createdOrderId },
      });

      expect(commissions.every((c) => c.status === 'AVAILABLE')).toBe(true);
    });
  });

  describe('6. Self-Referral Fraud Protection', () => {
    it('blocks commission generation when the purchaser is the affiliate themselves', async () => {
      const prodRes = await request(app).get('/api/products');
      const variant = prodRes.body.data[0]?.variants?.[0];

      // Affiliate orders with their own email
      const selfOrder = await request(app)
        .post('/api/orders')
        .set('x-session-id', testSessionId)
        .send({
          customer: {
            fullName: 'Kelvin Adeniyi',
            email: testAffiliateEmail, // Matches affiliate email
            phone: '+2348012345678',
            state: 'Lagos',
            city: 'Lekki',
            address: 'Affiliate Home Address',
          },
          shippingRegion: 'lagos',
          paymentMethod: 'paystack',
          items: [{ variantId: variant.id, quantity: 2 }],
        });

      expect(selfOrder.status).toBe(201);
      const selfOrderId = selfOrder.body.data.id;

      // Confirm payment
      await request(app)
        .post('/api/payments/verify')
        .send({ reference: selfOrder.body.data.orderNumber });

      // Verify no commission was generated for self-purchase
      const commissions = await prisma.affiliateCommission.findMany({
        where: { orderId: selfOrderId },
      });

      expect(commissions.length).toBe(0);
    });
  });

  describe('7. Order Cancellation & Return Commission Reversal', () => {
    it('reverses commissions when an order is cancelled or returned', async () => {
      const prodRes = await request(app).get('/api/products');
      const variant = prodRes.body.data[0]?.variants?.[0];

      // Create new order
      const ordRes = await request(app)
        .post('/api/orders')
        .set('x-session-id', testSessionId)
        .send({
          customer: {
            fullName: 'Chidi Obi',
            email: 'chidi.obi@gmail.com',
            phone: '+2348055667788',
            state: 'Lagos',
            city: 'Ikeja',
            address: '15 Allen Avenue',
          },
          shippingRegion: 'lagos',
          paymentMethod: 'paystack',
          items: [{ variantId: variant.id, quantity: 2 }],
        });

      const orderId = ordRes.body.data.id;
      const orderNumber = ordRes.body.data.orderNumber;

      // Verify payment -> Pending commission created
      await request(app)
        .post('/api/payments/verify')
        .send({ reference: orderNumber });

      // Admin cancels order
      await request(app)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED', note: 'Customer requested cancellation' });

      const commissions = await prisma.affiliateCommission.findMany({
        where: { orderId },
      });

      expect(commissions.every((c) => c.status === 'REVERSED')).toBe(true);
      expect(commissions[0].reversalReason).toBeDefined();
    });
  });

  describe('8. Payout Lifecycle & Minimum Threshold Enforcement', () => {
    it('blocks payout requests below the ₦500 minimum threshold', async () => {
      const payoutRes = await request(app)
        .post('/api/affiliate/payouts/request')
        .set('Authorization', `Bearer ${testAffiliateToken}`)
        .send({
          amountNGN: 499,
          bankName: 'Access Bank',
          accountNumber: '0123456789',
          accountName: 'Kelvin Adeniyi',
        });

      expect(payoutRes.status).toBe(400);
      expect(payoutRes.body.error).toMatch(/500|minimum/i);
    });

    it('allows a ₦500 partial payout from available earnings', async () => {
      // Create additional delivered order of 6 products = ₦3,000, bringing total to ₦5,500
      const prodRes = await request(app).get('/api/products');
      const variant = prodRes.body.data[0]?.variants?.[0];

      const ordRes = await request(app)
        .post('/api/orders')
        .set('x-session-id', testSessionId)
        .send({
          amountNGN: 500,
          customer: {
            fullName: 'Grace Okafor',
            email: 'grace.okafor@gmail.com',
            phone: '+2348077889900',
            state: 'Lagos',
            city: 'Ikoyi',
            address: '22 Bourdillon Road',
          },
          shippingRegion: 'lagos',
          paymentMethod: 'paystack',
          items: [{ variantId: variant.id, quantity: 6 }],
        });

      const ordId = ordRes.body.data.id;
      const ordNum = ordRes.body.data.orderNumber;

      await request(app).post('/api/payments/verify').send({ reference: ordNum });
      await CommissionService.markCommissionsAvailable(ordId);

      // Now request payout (total available = ₦5,500 >= ₦5,000)
      const payoutRes = await request(app)
        .post('/api/affiliate/payouts/request')
        .set('Authorization', `Bearer ${testAffiliateToken}`)
        .send({
          bankName: 'Access Bank',
          accountNumber: '0123456789',
          accountName: 'Kelvin Adeniyi',
        });

      expect(payoutRes.status).toBe(201);
      expect(payoutRes.body.success).toBe(true);
      expect(payoutRes.body.data.status).toBe('PENDING');
      expect(payoutRes.body.data.amountKobo).toBe(50000);

      const payoutId = payoutRes.body.data.id;

      // Admin reviews and marks payout as PAID
      const adminPayRes = await request(app)
        .post('/api/admin/affiliates/payouts/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          payoutId,
          action: 'PAID',
          paymentReference: 'TRF-GTB-99882244',
          adminNote: 'Transferred to Kelvin Access Bank account',
        });

      expect(adminPayRes.status).toBe(200);
      expect(adminPayRes.body.success).toBe(true);
      expect(adminPayRes.body.data.status).toBe('PAID');
    });
  });

  describe('9. Security & Role Boundaries', () => {
    it('prevents affiliates from accessing admin endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${testAffiliateToken}`);

      expect([401, 403]).toContain(res.status);
    });

    it('prevents non-admins from reviewing or approving affiliates', async () => {
      const res = await request(app)
        .post(`/api/admin/affiliates/${testAffiliateId}/review`)
        .set('Authorization', `Bearer ${testAffiliateToken}`)
        .send({ action: 'APPROVE' });

      expect([401, 403]).toContain(res.status);
    });
  });
});
