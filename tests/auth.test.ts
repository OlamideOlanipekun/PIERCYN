import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/server/db/store';
import { AuthService } from '../src/server/services/authService';
import { OrderService } from '../src/server/services/orderService';
import { ProductService } from '../src/server/services/productService';

describe('PIERCYN Atelier Authentication & Customer Portal', () => {
  beforeEach(() => {
    dbStore.seedFromCatalog();
  });

  describe('1. Registration', () => {
    it('registers a new atelier client and returns safe profile with session token', async () => {
      const email = `amara_${Date.now()}@example.com`;
      const result = await AuthService.register({
        email,
        password: 'securePassword123',
        firstName: 'Amara',
        lastName: 'Okafor',
        phone: '+2348033221100',
        city: 'Ikoyi, Lagos',
        address: '5 Glover Road',
      });

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.user.firstName).toBe('Amara');
      expect(result.user.lastName).toBe('Okafor');
      expect(result.user.city).toBe('Ikoyi, Lagos');
      expect(result.user.role).toBe('CUSTOMER');
      expect(result.token).toMatch(/^tok_/);
      expect((result.user as any).passwordHash).toBeUndefined();
    }, 20000);

    it('rejects duplicate registration for an existing email address', async () => {
      const email = `dup_${Date.now()}@example.com`;
      // First registration
      await AuthService.register({
        email,
        password: 'pass1',
        firstName: 'First',
        lastName: 'User',
      });

      // Second attempt with same email
      await expect(
        AuthService.register({
          email,
          password: 'pass2',
          firstName: 'Second',
          lastName: 'User',
        })
      ).rejects.toThrow(/already exists/i);
    }, 20000);
  });

  describe('2. Client Login & Session Verification', () => {
    it('authenticates seeded default client account with valid credentials', async () => {
      const result = await AuthService.login({
        email: 'client@piercyn.com',
        password: 'piercyn2026',
      });

      expect(result.user.email).toBe('client@piercyn.com');
      expect(result.user.firstName).toBe('Tunde');
      expect(result.user.lastName).toBe('Adeleke');
      expect(result.token).toMatch(/^tok_/);
    }, 20000);

    it('rejects login with non-existent email', async () => {
      await expect(
        AuthService.login({
          email: 'nonexistent_user_9999@example.com',
          password: 'anypassword',
        })
      ).rejects.toThrow(/No account found/i);
    }, 20000);

    it('rejects login with incorrect password', async () => {
      await expect(
        AuthService.login({
          email: 'client@piercyn.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(/Incorrect password/i);
    }, 20000);

    it('retrieves user profile via valid session token and reflects linked orders count', async () => {
      const email = `order_client_${Date.now()}@example.com`;
      const auth = await AuthService.register({
        email,
        password: 'pass',
        firstName: 'Bimbo',
        lastName: 'Martins',
      });

      // Create an order for this client email
      const products = ProductService.getAllProducts();
      const variant = products[0].variants[0];

      OrderService.createOrder({
        customer: {
          fullName: 'Bimbo Martins',
          email,
          phone: '+2348000000000',
          state: 'Lagos State',
          city: 'Lekki',
          address: 'Admiralty Way',
        },
        shippingRegion: 'lagos',
        paymentMethod: 'paystack',
        items: [{ variantId: variant.id, quantity: 1 }],
      });

      const profile = await AuthService.getUserByToken(auth.token);
      expect(profile).not.toBeNull();
      expect(profile?.email).toBe(email);
      expect(profile?.ordersCount).toBe(1);
    }, 20000);

    it('invalidates session token on logout', async () => {
      const auth = await AuthService.login({
        email: 'client@piercyn.com',
        password: 'piercyn2026',
      });

      expect(await AuthService.getUserByToken(auth.token)).not.toBeNull();

      AuthService.logout(auth.token);
      expect(await AuthService.getUserByToken(auth.token)).toBeNull();
    }, 20000);
  });
});
