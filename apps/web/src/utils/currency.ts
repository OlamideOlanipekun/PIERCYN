import { Currency, Product } from '../types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€'
};

const ngnFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function formatPrice(productOrNumber: Product | number | undefined | null, currency: Currency = 'NGN'): string {
  if (!productOrNumber) {
    return currency === 'NGN' ? formatNGN(0) : currency === 'USD' ? '$0' : currency === 'GBP' ? '£0' : '€0';
  }

  if (typeof productOrNumber === 'number') {
    return formatNumericPrice(productOrNumber, currency);
  }

  const product = productOrNumber;
  switch (currency) {
    case 'NGN':
      return formatNGN(product.priceNGN ?? 0);
    case 'USD':
      return `$${product.priceUSD ?? Math.round((product.priceNGN ?? 0) / 820)}`;
    case 'GBP':
      return `£${product.priceGBP ?? Math.round((product.priceNGN ?? 0) / 1040)}`;
    case 'EUR':
      return `€${product.priceEUR ?? Math.round((product.priceNGN ?? 0) / 890)}`;
    default:
      return formatNGN(product.priceNGN ?? 0);
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
      return formatNGN(safePrice);
    case 'USD':
      return `$${Math.round(safePrice * rates.USD)}`;
    case 'GBP':
      return `£${Math.round(safePrice * rates.GBP)}`;
    case 'EUR':
      return `€${Math.round(safePrice * rates.EUR)}`;
    default:
      return formatNGN(safePrice);
  }
}

export function formatNGN(priceNGN: number | undefined | null): string {
  const safePrice = typeof priceNGN === 'number' && !isNaN(priceNGN) ? priceNGN : 0;
  return ngnFormatter.format(safePrice);
}
