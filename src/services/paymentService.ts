import { PaymentDetails, PaymentResult } from '../types';

export interface PaymentProvider {
  name: string;
  isLive: boolean;
  initializePayment(details: PaymentDetails): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<boolean>;
}

export class DirectTransferPaymentProvider implements PaymentProvider {
  name = 'Direct Order & Bank Transfer';
  isLive = false;

  async initializePayment(details: PaymentDetails): Promise<PaymentResult> {
    // Generate order confirmation reference
    const ref = `PCY-TRF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      success: true,
      transactionReference: ref,
      message: 'Order placed successfully. Please complete bank transfer or WhatsApp confirmation.',
      paidAt: undefined, // Explicitly not marked as paid until manual confirmation
    };
  }

  async verifyPayment(_reference: string): Promise<boolean> {
    return false; // Requires merchant verification
  }
}

export class PaystackPaymentProvider implements PaymentProvider {
  name = 'Paystack';
  isLive = true;
  private publicKey: string;

  constructor(publicKey: string = '') {
    this.publicKey = publicKey;
  }

  async initializePayment(details: PaymentDetails): Promise<PaymentResult> {
    if (!this.publicKey) {
      return new DirectTransferPaymentProvider().initializePayment(details);
    }

    return new Promise((resolve) => {
      const paystackPop = (window as any).PaystackPop;
      if (!paystackPop) {
        // If Paystack script is not loaded in window
        resolve({
          success: false,
          transactionReference: details.orderNumber,
          message: 'Payment gateway could not be loaded. Please try WhatsApp / Transfer checkout.',
        });
        return;
      }

      const handler = paystackPop.setup({
        key: this.publicKey,
        email: details.customerEmail,
        amount: Math.round(details.amountNGN * 100),
        ref: details.orderNumber,
        callback: (response: any) => {
          resolve({
            success: true,
            transactionReference: response.reference,
            message: 'Payment authorized successfully via Paystack',
            paidAt: new Date().toISOString(),
          });
        },
        onClose: () => {
          resolve({
            success: false,
            transactionReference: details.orderNumber,
            message: 'Payment was cancelled by customer',
          });
        },
      });

      if (handler) {
        handler.openIframe();
      } else {
        resolve({
          success: false,
          transactionReference: details.orderNumber,
          message: 'Unable to initialize Paystack checkout',
        });
      }
    });
  }

  async verifyPayment(reference: string): Promise<boolean> {
    return Boolean(reference);
  }
}

// Check for configured public key
const envKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || '';

let currentPaymentProvider: PaymentProvider = envKey 
  ? new PaystackPaymentProvider(envKey) 
  : new DirectTransferPaymentProvider();

export const isLivePaymentConfigured = (): boolean => {
  return Boolean(envKey && currentPaymentProvider.isLive);
};

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
