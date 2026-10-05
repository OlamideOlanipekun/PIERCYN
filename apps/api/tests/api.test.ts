import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('PIERCYN Standalone Express API Service', () => {
  describe('1. Health and Liveness Endpoint', () => {
    it('GET /health returns service status and database status', async () => {
      const res = await request(app).get('/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body.service).toBe('piercyn-api');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.database).toBeDefined();
    });

    it('GET /api/health returns matching health payload', async () => {
      const res = await request(app).get('/api/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body.service).toBe('piercyn-api');
    });
  });

  describe('2. Product Catalog API', () => {
    it('GET /api/products returns structured products array', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/products/:slug returns product detail or 404 for missing', async () => {
      const listRes = await request(app).get('/api/products');
      const firstProduct = listRes.body.data[0];

      if (firstProduct) {
        const detailRes = await request(app).get(`/api/products/${firstProduct.slug}`);
        expect(detailRes.status).toBe(200);
        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data.id).toBe(firstProduct.id);
      }

      const notFoundRes = await request(app).get('/api/products/non-existent-product-slug-xyz');
      expect(notFoundRes.status).toBe(404);
      expect(notFoundRes.body.success).toBe(false);
    });

    it('GET /api/categories returns categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('3. Shipping & Checkout Configuration', () => {
    it('GET /api/shipping/options calculates Lagos and Nationwide fees', async () => {
      const res = await request(app).get('/api/shipping/options?subtotal=50000');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const options = res.body.data as Array<{ key: string; feeNGN: number; isFree: boolean }>;
      const lagos = options.find((o) => o.key === 'lagos');
      const nationwide = options.find((o) => o.key === 'nationwide');
      expect(lagos).toBeDefined();
      expect(lagos!.feeNGN).toBe(2500);
      expect(nationwide).toBeDefined();
      expect(nationwide!.feeNGN).toBe(4500);
    });

    it('GET /api/shipping/options provides free shipping at or above ₦100k threshold', async () => {
      const res = await request(app).get('/api/shipping/options?subtotal=150000');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const options = res.body.data as Array<{ key: string; feeNGN: number; isFree: boolean }>;
      const lagos = options.find((o) => o.key === 'lagos');
      const nationwide = options.find((o) => o.key === 'nationwide');
      expect(lagos!.feeNGN).toBe(0);
      expect(lagos!.isFree).toBe(true);
      expect(nationwide!.feeNGN).toBe(0);
      expect(nationwide!.isFree).toBe(true);
    });
  });

  describe('4. Server-Side Cart Management', () => {
    it('GET /api/cart retrieves cart for a session', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('x-session-id', 'test-sess-api-01');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.sessionId).toBe('test-sess-api-01');
    });

    it('DELETE /api/cart clears the session cart', async () => {
      const res = await request(app)
        .delete('/api/cart')
        .set('x-session-id', 'test-sess-api-01');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Checkout Quote Calculation', () => {
    it('POST /api/checkout/quote calculates pricing, shipping, and promos server-side', async () => {
      const listRes = await request(app).get('/api/products');
      const firstProduct = listRes.body.data[0];
      const firstVariant = firstProduct?.variants?.[0];

      if (firstVariant) {
        const res = await request(app)
          .post('/api/checkout/quote')
          .set('x-session-id', 'test-quote-sess')
          .send({
            shippingRegion: 'lagos',
            items: [{ variantId: firstVariant.id, quantity: 1 }],
            discountCode: 'STANDOUT',
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.subtotalNGN).toBeGreaterThan(0);
        expect(res.body.data.discountNGN).toBeGreaterThan(0);
        expect(res.body.data.totalNGN).toBe(
          res.body.data.subtotalNGN + res.body.data.deliveryFeeNGN - res.body.data.discountNGN
        );
      }
    });
  });

  describe('6. Events & Analytics Ingestion', () => {
    it('POST /api/events accepts and records analytics events safely', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({
          eventType: 'PRODUCT_VIEW',
          sessionId: 'test-session-123',
          metadata: { source: 'api-test' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('7. Atelier Client Authentication', () => {
    const testEmail = `atelier_client_${Date.now()}@example.com`;

    it('registers, logs in, checks profile, and logs out client', async () => {
      // 1. Register
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'TestPassword2026!',
          firstName: 'Folake',
          lastName: 'Balogun',
          phone: '+2348011223344',
          city: 'Lagos',
          address: 'Victoria Island',
        });

      expect(regRes.status).toBe(200);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.data.token).toBeDefined();
      const token = regRes.body.data.token;

      // 2. Profile with token
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe(testEmail.toLowerCase());

      // 3. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'TestPassword2026!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);

      // 4. Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });

    it('rejects unauthenticated /api/auth/me', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('8. Admin & Route Protection', () => {
    it('rejects unauthenticated requests to protected admin routes', async () => {
      const res = await request(app).get('/api/admin/orders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid credentials for admin login', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'invalid-admin@piercyn.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('authenticates admin with valid credentials and accesses protected settings', async () => {
      const loginRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@piercyn.com',
          password: 'piercynAdmin2026',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      const adminToken = loginRes.body.data.token;
      expect(adminToken).toBeDefined();

      const settingsRes = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(settingsRes.status).toBe(200);
      expect(settingsRes.body.success).toBe(true);
      expect(settingsRes.body.data.storeName).toBe('PIERCYN');
    });
  });
});
