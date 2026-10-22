import { COMMERCE_CONFIG } from '../../config/constants';

export interface BankTransferInstructions {
  bankName: string;
  accountName: string;
  accountNumber: string;
  narration: string;
  reviewWindowHours: number;
  amountNGN: number;
}

export function buildBankTransferInstructions(
  orderNumber: string,
  amountNGN: number
): BankTransferInstructions {
  const bank = COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER;
  return {
    bankName: bank.BANK_NAME,
    accountName: bank.ACCOUNT_NAME,
    accountNumber: bank.ACCOUNT_NUMBER,
    narration: orderNumber,
    reviewWindowHours: bank.REVIEW_WINDOW_HOURS,
    amountNGN,
  };
}

export function buildWhatsAppPaymentMessage(
  order: {
    orderNumber: string;
    customerName: string;
    subtotalNGN: number;
    discountNGN: number;
    deliveryFeeNGN: number;
    totalNGN: number;
  },
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  }
): string {
  const bank = bankDetails || {
    bankName: COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER.BANK_NAME,
    accountName: COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER.ACCOUNT_NAME,
    accountNumber: COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER.ACCOUNT_NUMBER,
  };
  const name = (order.customerName || '').split(' ')[0]?.trim() || 'Valued Customer';
  const formatNGN = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

  return (
    `Hello ${name} 👋\n\n` +
    `Your PIERCYN delivery quotation has been accepted.\n\n` +
    `*Order:* ${order.orderNumber}\n\n` +
    `Products: ${formatNGN(order.subtotalNGN)}\n` +
    `Discount: ${formatNGN(order.discountNGN)}\n` +
    `Delivery fee: ${formatNGN(order.deliveryFeeNGN)}\n\n` +
    `*Total payable: ${formatNGN(order.totalNGN)}*\n\n` +
    `Please make your transfer using the details below:\n\n` +
    `Bank: ${bank.bankName}\n` +
    `Account name: ${bank.accountName}\n` +
    `Account number: ${bank.accountNumber}\n\n` +
    `Please transfer the exact total shown above and upload your payment receipt through your PIERCYN order page.\n\n` +
    `Your order will be confirmed after we verify the payment.\n\n` +
    `Thank you for choosing PIERCYN!`
  );
}
