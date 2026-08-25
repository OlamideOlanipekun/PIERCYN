import { Currency, Product } from '../types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€'
};

export function formatPrice(productOrNumber: Product | number | undefined | null, currency: Currency = 'NGN'): string {
  if (!productOrNumber) {
    return currency === 'NGN' ? '₦0' : currency === 'USD' ? '$0' : currency === 'GBP' ? '£0' : '€0';
  }

  if (typeof productOrNumber === 'number') {
    return formatNumericPrice(productOrNumber, currency);
  }

  const product = productOrNumber;
  switch (currency) {
    case 'NGN':
      return `₦${(product.priceNGN ?? 0).toLocaleString('en-NG')}`;
    case 'USD':
      return `$${product.priceUSD ?? Math.round((product.priceNGN ?? 0) / 820)}`;
    case 'GBP':
      return `£${product.priceGBP ?? Math.round((product.priceNGN ?? 0) / 1040)}`;
    case 'EUR':
      return `€${product.priceEUR ?? Math.round((product.priceNGN ?? 0) / 890)}`;
    default:
      return `₦${(product.priceNGN ?? 0).toLocaleString('en-NG')}`;
  }
}

export function formatNumericPrice(priceNGN: number | undefined | null, currency: Currency = 'NGN'): string {
  const safePrice = typeof priceNGN === 'number' && !isNaN(priceNGN) ? priceNGN : 0;
  const rates = {
    NGN: 1,
    USD: 1 / 820,
    GBP: 1 / 1040,
    EUR: 1 / 890
  };

  switch (currency) {
    case 'NGN':
      return `₦${safePrice.toLocaleString('en-NG')}`;
    case 'USD':
      return `$${Math.round(safePrice * rates.USD)}`;
    case 'GBP':
      return `£${Math.round(safePrice * rates.GBP)}`;
    case 'EUR':
      return `€${Math.round(safePrice * rates.EUR)}`;
    default:
      return `₦${safePrice.toLocaleString('en-NG')}`;
  }
}
