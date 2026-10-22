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
