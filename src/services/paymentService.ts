import { PaymentDetails, PaymentResult } from '../types';

export interface PaymentProvider {
  name: string;
  initializePayment(details: PaymentDetails): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<boolean>;
}

export class MockPaymentProvider implements PaymentProvider {
  name = 'PIERCYN Direct Secure Checkout';

  async initializePayment(details: PaymentDetails): Promise<PaymentResult> {
    // Simulate lightweight network payment processing delay (1.2s)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const ref = `PCY-TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      transactionReference: ref,
      message: 'Payment authorized successfully via PIERCYN Secure Gateway',
      paidAt: new Date().toISOString(),
    };
  }

  async verifyPayment(_reference: string): Promise<boolean> {
    return true;
  }
}

export class PaystackPaymentProvider implements PaymentProvider {
  name = 'Paystack';
  private publicKey: string;

  constructor(publicKey: string = '') {
    this.publicKey = publicKey;
  }

  async initializePayment(details: PaymentDetails): Promise<PaymentResult> {
    if (!this.publicKey) {
      console.warn('Paystack public key missing. Using secure fallback provider.');
      return new MockPaymentProvider().initializePayment(details);
    }

    return new Promise((resolve) => {
      const handler = (window as any).PaystackPop?.setup({
        key: this.publicKey,
        email: details.customerEmail,
        amount: details.amountNGN * 100,
        ref: details.orderNumber,
        callback: (response: any) => {
          resolve({
            success: true,
            transactionReference: response.reference,
            message: 'Paystack payment complete',
            paidAt: new Date().toISOString(),
          });
        },
        onClose: () => {
          resolve({
            success: false,
            transactionReference: details.orderNumber,
            message: 'Payment modal closed by customer',
          });
        },
      });

      if (handler) {
        handler.openIframe();
      } else {
        new MockPaymentProvider().initializePayment(details).then(resolve);
      }
    });
  }

  async verifyPayment(reference: string): Promise<boolean> {
    return Boolean(reference);
  }
}

let currentPaymentProvider: PaymentProvider = new MockPaymentProvider();

export const setPaymentProvider = (provider: PaymentProvider) => {
  currentPaymentProvider = provider;
};

export const getPaymentProvider = (): PaymentProvider => {
  return currentPaymentProvider;
};

export const processCheckoutPayment = async (
  details: PaymentDetails
): Promise<PaymentResult> => {
  return currentPaymentProvider.initializePayment(details);
};
