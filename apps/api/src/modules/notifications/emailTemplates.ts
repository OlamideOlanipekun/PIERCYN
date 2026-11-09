import {
  OrderCreatedPayload,
  ReceiptUploadedPayload,
  PaymentVerifiedPayload,
  ProductOutOfStockPayload,
  QuoteNotificationPayload,
  PaymentDecisionPayload,
  FulfilmentNotificationPayload,
} from './types';
import { COMMERCE_CONFIG } from '../../config/constants';

function formatNGN(amount: number): string {
  const n = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(n);
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] as string);
}

const BASE_STYLES = `
  body { margin: 0; padding: 0; background-color: #F2F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #141414; -webkit-font-smoothing: antialiased; }
  .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px; box-sizing: border-box; }
  .card { background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 4px; padding: 32px 28px; }
  .header { border-bottom: 2px solid #141414; padding-bottom: 20px; margin-bottom: 24px; text-align: left; }
  .brand { font-size: 24px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #141414; margin: 0; }
  .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #78716C; margin-top: 6px; }
  .h1 { font-size: 18px; font-weight: 600; color: #141414; margin: 0 0 16px 0; }
  .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
  .meta-grid td { padding: 8px 0; border-bottom: 1px solid #F2F0EB; }
  .meta-label { color: #78716C; width: 35%; font-weight: 500; }
  .meta-val { color: #141414; font-weight: 600; }
  .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  .table th { text-align: left; padding: 10px 8px; background: #FAF9F6; border-bottom: 1px solid #E7E5E4; color: #78716C; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .table td { padding: 12px 8px; border-bottom: 1px solid #F2F0EB; color: #141414; }
  .total-row { font-weight: 700; font-size: 14px; background: #FAF9F6; }
  .badge { display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
  .badge-dark { background: #141414; color: #FFFFFF; }
  .badge-amber { background: #FEF3C7; color: #92400E; }
  .badge-red { background: #FEE2E2; color: #991B1B; }
  .badge-green { background: #DCFCE7; color: #166534; }
  .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #78716C; letter-spacing: 0.05em; }
  .button { display: inline-block; background-color: #141414; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 2px; margin-top: 20px; text-align: center; }
  .bank-box { background: #FAF9F6; border: 1px solid #E7E5E4; border-radius: 4px; padding: 16px; margin: 20px 0; font-size: 13px; }
`;

export function renderWelcomeEmail(payload: { firstName?: string; email: string }): { subject: string; html: string; text: string } {
  const name = payload.firstName ? payload.firstName.trim() : 'Valued Client';
  const siteUrl = process.env.APP_BASE_URL || 'https://piercyn.vercel.app';
  const subject = 'Welcome to PIERCYN';

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">Client Services • Atelier Welcome</div>
      </div>
      <div class="h1">Welcome, ${escapeHtml(name)}</div>
      <p style="font-size: 14px; line-height: 1.6; color: #44403C; margin: 0 0 16px 0;">
        Thank you for creating an account with PIERCYN. Our ready-to-wear atelier crafts architectural luxury silhouettes tailored with uncompromised precision in Nigeria.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #44403C; margin: 0 0 24px 0;">
        Your profile is activated. You can track orders in real time, manage delivery addresses, and explore limited seasonal releases.
      </p>
      <div style="text-align: center; margin: 28px 0 20px 0;">
        <a href="${siteUrl}/products" class="button">Explore Collections</a>
      </div>
    </div>
    <div class="footer">PIERCYN Luxury Atelier • piercyn@gmail.com</div>
  </div>
</body>
</html>`;

  const text = `Welcome to PIERCYN, ${name}!\n\nYour account is active. Explore our luxury ready-to-wear collections:\n${siteUrl}/products\n\nPIERCYN Atelier • piercyn@gmail.com`;
  return { subject, html, text };
}

export function renderOrderCreatedEmail(p: OrderCreatedPayload): { subject: string; html: string; text: string } {
  const subject = `[PIERCYN] New Order #${p.orderNumber} - ${formatNGN(p.totalNGN)}`;

  const itemsHtml = p.items
    .map(
      (item) => `
      <tr>
        <td>
          <div style="font-weight: 600;">${escapeHtml(item.name)}</div>
          <div style="font-size: 11px; color: #78716c;">${escapeHtml(item.sku)} • Size: ${escapeHtml(item.size)} • Color: ${escapeHtml(item.colour)}</div>
        </td>
        <td style="text-align: center;">${escapeHtml(item.quantity)}</td>
        <td style="text-align: right;">${escapeHtml(formatNGN(item.unitPriceNGN))}</td>
        <td style="text-align: right; font-weight: 600;">${escapeHtml(formatNGN(item.totalNGN))}</td>
      </tr>`
    )
    .join('');

  const itemsText = p.items
    .map((i) => `- ${i.name} (${i.sku}, ${i.size}/${i.colour}) x${i.quantity} = ${formatNGN(i.totalNGN)}`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">Commerce Engine • Order Notification</div>
      </div>
        <div class="h1">New Order Placed: #${escapeHtml(p.orderNumber)}</div>
        <table class="meta-grid">
        <tr><td class="meta-label">Customer</td><td class="meta-val">${escapeHtml(p.customerName)}</td></tr>
        <tr><td class="meta-label">Email</td><td class="meta-val">${escapeHtml(p.customerEmail)}</td></tr>
        <tr><td class="meta-label">Phone</td><td class="meta-val">${escapeHtml(p.customerPhone)}</td></tr>
        <tr><td class="meta-label">Delivery Address</td><td class="meta-val">${escapeHtml(p.deliveryAddress)}, ${escapeHtml(p.deliveryCity)}, ${escapeHtml(p.deliveryState)}</td></tr>
        <tr><td class="meta-label">Payment Method</td><td class="meta-val"><span class="badge badge-dark">${escapeHtml(p.paymentMethod)}</span></td></tr>
        ${p.orderNote ? `<tr><td class="meta-label">Order Note</td><td class="meta-val">${escapeHtml(p.orderNote)}</td></tr>` : ''}
      </table>

      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr><td colspan="3" style="text-align: right; color: #78716C;">Subtotal</td><td style="text-align: right;">${escapeHtml(formatNGN(p.subtotalNGN))}</td></tr>
          ${p.discountNGN > 0 ? `<tr><td colspan="3" style="text-align: right; color: #78716C;">Discount</td><td style="text-align: right; color: #DC2626;">-${escapeHtml(formatNGN(p.discountNGN))}</td></tr>` : ''}
          <tr><td colspan="3" style="text-align: right; color: #78716C;">Delivery Fee</td><td style="text-align: right;">${p.deliveryFeeNGN > 0 ? escapeHtml(formatNGN(p.deliveryFeeNGN)) : 'Quote Pending'}</td></tr>
          <tr class="total-row"><td colspan="3" style="text-align: right;">Total</td><td style="text-align: right; color: #141414;">${escapeHtml(formatNGN(p.totalNGN))}</td></tr>
        </tbody>
      </table>

      ${
        p.paymentMethod === 'BANK_TRANSFER' || p.paymentMethod === 'DIRECT_TRANSFER'
          ? `
      <div class="bank-box">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; color: #78716C; margin-bottom: 8px;">Direct Bank Transfer Instructions</div>
        <div><strong>Bank:</strong> ${escapeHtml(COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER.BANK_NAME)}</div>
        <div><strong>Account Name:</strong> ${escapeHtml(COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER.ACCOUNT_NAME)}</div>
        <div><strong>Account Number:</strong> <code style="font-size: 14px; font-weight: 700;">${escapeHtml(COMMERCE_CONFIG.PAYMENT.BANK_TRANSFER.ACCOUNT_NUMBER)}</code></div>
        <div><strong>Amount:</strong> <strong>${escapeHtml(formatNGN(p.totalNGN))}</strong></div>
        <div><strong>Narration:</strong> <code>${escapeHtml(p.orderNumber)}</code></div>
      </div>
      `
          : ''
      }

      <div style="text-align: center; margin: 24px 0 12px 0;">
        <a href="${process.env.APP_BASE_URL || 'https://piercyn.vercel.app'}/account/orders/${escapeHtml(p.orderId || p.orderNumber)}" class="button">View Order Details</a>
      </div>
    </div>
    <div class="footer">PIERCYN Automated Commercial Dispatch • Ref: ${escapeHtml(p.orderNumber)}</div>
  </div>
</body>
</html>`;

  const text = `PIERCYN - NEW ORDER #${p.orderNumber}
=================================================
Customer: ${p.customerName} (${p.customerEmail}, ${p.customerPhone})
Address: ${p.deliveryAddress}, ${p.deliveryCity}, ${p.deliveryState}
Payment Method: ${p.paymentMethod}
${p.orderNote ? `Note: ${p.orderNote}\n` : ''}
ITEMS:
${itemsText}

Subtotal: ${formatNGN(p.subtotalNGN)}
Discount: -${formatNGN(p.discountNGN)}
Delivery Fee: ${p.deliveryFeeNGN > 0 ? formatNGN(p.deliveryFeeNGN) : 'Quote Pending'}
TOTAL: ${formatNGN(p.totalNGN)}
`;

  return { subject, html, text };
}

export function renderReceiptUploadedEmail(p: ReceiptUploadedPayload): { subject: string; html: string; text: string } {
  const subject = `[PIERCYN] Payment Receipt Uploaded - Order #${p.orderNumber}`;

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">Direct Transfer Review • Action Required</div>
      </div>
      <div class="h1">Bank Transfer Receipt Received</div>
      <p style="font-size: 13px; color: #78716c; margin-top: -8px;">A customer has submitted a transfer receipt for Order #${escapeHtml(p.orderNumber)}. Verification is pending.</p>
      
      <table class="meta-grid">
        <tr><td class="meta-label">Order Number</td><td class="meta-val">#${escapeHtml(p.orderNumber)}</td></tr>
        <tr><td class="meta-label">Customer</td><td class="meta-val">${escapeHtml(p.customerName)}</td></tr>
        <tr><td class="meta-label">Contact</td><td class="meta-val">${escapeHtml(p.customerEmail)} • ${escapeHtml(p.customerPhone)}</td></tr>
        <tr><td class="meta-label">Amount Expected</td><td class="meta-val">${escapeHtml(formatNGN(p.totalNGN))}</td></tr>
        <tr><td class="meta-label">Transfer Ref</td><td class="meta-val"><code>${escapeHtml(p.providerReference)}</code></td></tr>
        <tr><td class="meta-label">Uploaded At</td><td class="meta-val">${escapeHtml(new Date(p.uploadedAt).toLocaleString('en-NG'))}</td></tr>
        <tr><td class="meta-label">Review Deadline</td><td class="meta-val"><span class="badge badge-amber">${escapeHtml(new Date(p.reviewDeadlineAt).toLocaleString('en-NG'))}</span></td></tr>
        <tr><td class="meta-label">Storage Path</td><td class="meta-val" style="word-break: break-all; font-family: monospace; font-size: 11px;">${escapeHtml(p.receiptPath)}</td></tr>
      </table>
    </div>
    <div class="footer">PIERCYN Direct Transfer Review System</div>
  </div>
</body>
</html>`;

  const text = `PIERCYN - PAYMENT RECEIPT UPLOADED
=================================================
Order: #${p.orderNumber}
Customer: ${p.customerName} (${p.customerEmail}, ${p.customerPhone})
Amount: ${formatNGN(p.totalNGN)}
Reference: ${p.providerReference}
Uploaded At: ${p.uploadedAt}
Review Deadline: ${p.reviewDeadlineAt}
Receipt Storage Path: ${p.receiptPath}
`;

  return { subject, html, text };
}

export function renderPaymentVerifiedEmail(p: PaymentVerifiedPayload): { subject: string; html: string; text: string } {
  const subject = `[PIERCYN] Payment Verified - Order #${p.orderNumber} (${formatNGN(p.amountNGN)})`;

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">Payment Reconciliation • Confirmed</div>
      </div>
      <div class="h1">Payment Confirmed: Order #${escapeHtml(p.orderNumber)}</div>
      <p style="font-size: 13px; color: #78716c; margin-top: -8px;">Full payment has been verified. The order is now moving into fulfilment.</p>
      
      <table class="meta-grid">
        <tr><td class="meta-label">Order Number</td><td class="meta-val">#${escapeHtml(p.orderNumber)}</td></tr>
        <tr><td class="meta-label">Customer</td><td class="meta-val">${escapeHtml(p.customerName)}</td></tr>
        <tr><td class="meta-label">Email</td><td class="meta-val">${escapeHtml(p.customerEmail)}</td></tr>
        <tr><td class="meta-label">Amount Confirmed</td><td class="meta-val" style="color: #15803d; font-size: 15px;">${escapeHtml(formatNGN(p.amountNGN))}</td></tr>
        <tr><td class="meta-label">Payment Method</td><td class="meta-val">${escapeHtml(p.paymentMethod)}</td></tr>
        <tr><td class="meta-label">Provider Ref</td><td class="meta-val"><code>${escapeHtml(p.providerReference)}</code></td></tr>
        <tr><td class="meta-label">Source</td><td class="meta-val"><span class="badge badge-dark">${escapeHtml(p.verificationSource)}</span></td></tr>
        <tr><td class="meta-label">Verified At</td><td class="meta-val">${escapeHtml(new Date(p.verifiedAt).toLocaleString('en-NG'))}</td></tr>
        ${p.verifiedBy ? `<tr><td class="meta-label">Verified By</td><td class="meta-val">${escapeHtml(p.verifiedBy)}</td></tr>` : ''}
      </table>
    </div>
    <div class="footer">PIERCYN Automated Commercial Engine</div>
  </div>
</body>
</html>`;

  const text = `PIERCYN - PAYMENT VERIFIED
=================================================
Order: #${p.orderNumber}
Customer: ${p.customerName} (${p.customerEmail})
Amount: ${formatNGN(p.amountNGN)}
Method: ${p.paymentMethod}
Reference: ${p.providerReference}
Source: ${p.verificationSource}
Verified At: ${p.verifiedAt}
${p.verifiedBy ? `Verified By: ${p.verifiedBy}\n` : ''}
`;

  return { subject, html, text };
}

export function renderOutOfStockEmail(p: ProductOutOfStockPayload): { subject: string; html: string; text: string } {
  const subject = `[PIERCYN ALERT] Out of Stock - ${p.productName} (${p.sku})`;

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">Inventory Alert • Inventory Depleted</div>
      </div>
      <div class="h1"><span class="badge badge-red" style="vertical-align: middle; margin-right: 6px;">SOLD OUT</span> ${escapeHtml(p.productName)}</div>
      <p style="font-size: 13px; color: #78716c; margin-top: -8px;">A product variant has reached zero stock and is now marked sold out in the storefront.</p>
      
      <table class="meta-grid">
        <tr><td class="meta-label">Product Name</td><td class="meta-val">${escapeHtml(p.productName)}</td></tr>
        <tr><td class="meta-label">SKU</td><td class="meta-val"><code>${escapeHtml(p.sku)}</code></td></tr>
        <tr><td class="meta-label">Variant Specs</td><td class="meta-val">Size: ${escapeHtml(p.size)} • Color: ${escapeHtml(p.colour)}</td></tr>
        <tr><td class="meta-label">Depleted At</td><td class="meta-val">${escapeHtml(new Date(p.depletedAt).toLocaleString('en-NG'))}</td></tr>
        ${p.triggerReference ? `<tr><td class="meta-label">Depletion Trigger</td><td class="meta-val">${escapeHtml(p.triggerReference)}</td></tr>` : ''}
        ${p.reason ? `<tr><td class="meta-label">Reason</td><td class="meta-val">${escapeHtml(p.reason)}</td></tr>` : ''}
      </table>
    </div>
    <div class="footer">PIERCYN Real-time Inventory Guard</div>
  </div>
</body>
</html>`;

  const text = `PIERCYN INVENTORY ALERT - OUT OF STOCK
=================================================
Product: ${p.productName}
SKU: ${p.sku}
Size: ${p.size}
Color: ${p.colour}
Depleted At: ${p.depletedAt}
Trigger: ${p.triggerReference || 'N/A'}
Reason: ${p.reason || 'N/A'}
`;

  return { subject, html, text };
}

export function renderPaymentDecisionEmail(
  p: PaymentDecisionPayload,
  isVerified: boolean
): { subject: string; html: string; text: string } {
  const typeLabel = p.paymentType === 'PRODUCT' ? 'Product Payment' : 'Delivery Payment';
  const statusLabel = isVerified ? 'VERIFIED' : 'REJECTED';
  const subject = `[PIERCYN] ${typeLabel} ${statusLabel} - #${p.orderNumber}`;

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">${escapeHtml(typeLabel)} • ${escapeHtml(statusLabel)}</div>
      </div>
      <div class="h1">
        <span class="badge ${isVerified ? 'badge-dark' : 'badge-red'}" style="vertical-align: middle; margin-right: 6px;">
          ${escapeHtml(statusLabel)}
        </span>
        Order #${escapeHtml(p.orderNumber)}
      </div>
      <p style="font-size: 13px; color: #55524d;">
        ${isVerified
          ? `Your ${typeLabel.toLowerCase()} has been verified by the PIERCYN team.`
          : `Your ${typeLabel.toLowerCase()} could not be verified.`}
      </p>

      <table class="meta-grid">
        <tr><td class="meta-label">Customer</td><td class="meta-val">${escapeHtml(p.customerName)}</td></tr>
        <tr><td class="meta-label">Amount</td><td class="meta-val">${escapeHtml(formatNGN(p.amountNGN))}</td></tr>
        <tr><td class="meta-label">Reference</td><td class="meta-val"><code>${escapeHtml(p.providerReference)}</code></td></tr>
        ${!isVerified && p.rejectionReason ? `<tr><td class="meta-label">Reason</td><td class="meta-val" style="color: #b91c1c;">${escapeHtml(p.rejectionReason)}</td></tr>` : ''}
        ${p.verifiedBy ? `<tr><td class="meta-label">Reviewed By</td><td class="meta-val">${escapeHtml(p.verifiedBy)}</td></tr>` : ''}
        <tr><td class="meta-label">Date</td><td class="meta-val">${escapeHtml(new Date(p.timestamp).toLocaleString('en-NG'))}</td></tr>
      </table>

      <div style="text-align: center; margin: 24px 0 12px 0;">
        <a href="${process.env.APP_BASE_URL || 'https://piercyn.vercel.app'}/account/orders/${escapeHtml(p.orderId || p.orderNumber)}" class="button">View Order</a>
      </div>
    </div>
    <div class="footer">PIERCYN Luxury Atelier</div>
  </div>
</body>
</html>`;

  const text = `PIERCYN - ${typeLabel.toUpperCase()} ${statusLabel}
Order: #${p.orderNumber}
Customer: ${p.customerName}
Amount: ${formatNGN(p.amountNGN)}
Reference: ${p.providerReference}
${!isVerified && p.rejectionReason ? `Rejection Reason: ${p.rejectionReason}\n` : ''}
Date: ${p.timestamp}
`;

  return { subject, html, text };
}

export function renderDeliveryQuoteCreatedEmail(
  p: QuoteNotificationPayload
): { subject: string; html: string; text: string } {
  const subject = `[PIERCYN] Delivery Quotation Available - Order #${p.orderNumber}`;
  const siteUrl = process.env.APP_BASE_URL || 'https://piercyn.vercel.app';
  const ctaUrl = p.decisionUrl || `${siteUrl}/account/orders/${p.orderId}/delivery`;

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">Logistics & Fulfilment • Quotation Ready</div>
      </div>
      <div class="h1">Delivery Quotation for Order #${escapeHtml(p.orderNumber)}</div>
      <p style="font-size: 13px; color: #78716C; margin-top: -8px;">Your delivery fee has been calculated and is ready for your review.</p>
      
      <table class="meta-grid">
        <tr><td class="meta-label">Order Number</td><td class="meta-val">#${escapeHtml(p.orderNumber)}</td></tr>
        <tr><td class="meta-label">Customer</td><td class="meta-val">${escapeHtml(p.customerName)}</td></tr>
        <tr><td class="meta-label">Merchandise Subtotal</td><td class="meta-val">${escapeHtml(formatNGN(p.subtotalNGN))}</td></tr>
        <tr><td class="meta-label">Quoted Delivery Fee</td><td class="meta-val" style="font-size: 15px; font-weight: 700; color: #141414;">${escapeHtml(formatNGN(p.deliveryFeeNGN))}</td></tr>
        ${p.expiresAt ? `<tr><td class="meta-label">Quotation Expiry</td><td class="meta-val"><span class="badge badge-amber">${escapeHtml(new Date(p.expiresAt).toLocaleString('en-NG'))}</span></td></tr>` : ''}
      </table>

      <div style="text-align: center; margin: 24px 0 16px 0;">
        <a href="${ctaUrl}" class="button">Review Delivery Quote</a>
      </div>
    </div>
    <div class="footer">PIERCYN Commercial Engine • piercyn@gmail.com</div>
  </div>
</body>
</html>`;

  const text = `PIERCYN - DELIVERY QUOTATION AVAILABLE
=================================================
Order: #${p.orderNumber}
Customer: ${p.customerName}
Quoted Delivery Fee: ${formatNGN(p.deliveryFeeNGN)}
Subtotal: ${formatNGN(p.subtotalNGN)}
Review Quotation: ${ctaUrl}
`;

  return { subject, html, text };
}

export function renderQuoteDecisionEmail(
  p: QuoteNotificationPayload,
  action: 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
): { subject: string; html: string; text: string } {
  const subject = `[PIERCYN] Delivery Quotation ${action} - #${p.orderNumber}`;

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">Delivery Quotation • ${escapeHtml(action)}</div>
      </div>
      <div class="h1">Quotation ${escapeHtml(action)} for #${escapeHtml(p.orderNumber)}</div>
      <table class="meta-grid">
        <tr><td class="meta-label">Customer</td><td class="meta-val">${escapeHtml(p.customerName)} (${escapeHtml(p.customerEmail)})</td></tr>
        <tr><td class="meta-label">Quoted Delivery Fee</td><td class="meta-val">${escapeHtml(formatNGN(p.deliveryFeeNGN))}</td></tr>
        <tr><td class="meta-label">Merchandise Subtotal</td><td class="meta-val">${escapeHtml(formatNGN(p.subtotalNGN))}</td></tr>
        ${p.rejectionReason ? `<tr><td class="meta-label">Feedback</td><td class="meta-val">${escapeHtml(p.rejectionReason)}</td></tr>` : ''}
      </table>
    </div>
    <div class="footer">PIERCYN Commercial Engine</div>
  </div>
</body>
</html>`;

  const text = `PIERCYN - DELIVERY QUOTATION ${action}
Order: #${p.orderNumber}
Customer: ${p.customerName}
Quoted Delivery Fee: ${formatNGN(p.deliveryFeeNGN)}
${p.rejectionReason ? `Feedback: ${p.rejectionReason}\n` : ''}
`;

  return { subject, html, text };
}

export function renderFulfilmentEmail(
  p: FulfilmentNotificationPayload,
  stage: 'DISPATCHED' | 'DELIVERED'
): { subject: string; html: string; text: string } {
  const subject = `[PIERCYN] Your Order #${p.orderNumber} is ${stage === 'DISPATCHED' ? 'on the way' : 'delivered'}`;

  const html = `<!DOCTYPE html>
<html>
<head><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand">PIERCYN</h1>
        <div class="eyebrow">Order Fulfilment • ${escapeHtml(stage)}</div>
      </div>
      <div class="h1">Order #${escapeHtml(p.orderNumber)} ${stage === 'DISPATCHED' ? 'Dispatched' : 'Delivered'}</div>
      <p style="font-size: 13px; color: #55524d;">
        ${stage === 'DISPATCHED'
          ? 'Your order has been safely packaged and handed to our logistics partner.'
          : 'Your order has been successfully delivered. Thank you for choosing PIERCYN.'}
      </p>
      <table class="meta-grid">
        <tr><td class="meta-label">Recipient</td><td class="meta-val">${escapeHtml(p.customerName)}</td></tr>
        <tr><td class="meta-label">Delivery Address</td><td class="meta-val">${escapeHtml(p.deliveryAddress)}, ${escapeHtml(p.deliveryCity)}, ${escapeHtml(p.deliveryState)}</td></tr>
        ${p.logisticsProvider ? `<tr><td class="meta-label">Logistics Provider</td><td class="meta-val">${escapeHtml(p.logisticsProvider)}</td></tr>` : ''}
        ${p.dispatchReference ? `<tr><td class="meta-label">Dispatch Ref</td><td class="meta-val"><code>${escapeHtml(p.dispatchReference)}</code></td></tr>` : ''}
      </table>

      <div style="text-align: center; margin: 24px 0 12px 0;">
        <a href="${process.env.APP_BASE_URL || 'https://piercyn.vercel.app'}/account/orders/${escapeHtml(p.orderId || p.orderNumber)}" class="button">Track Order</a>
      </div>
    </div>
    <div class="footer">PIERCYN Luxury Atelier</div>
  </div>
</body>
</html>`;

  const text = `PIERCYN - ORDER ${stage}
Order: #${p.orderNumber}
Customer: ${p.customerName}
Delivery Address: ${p.deliveryAddress}, ${p.deliveryCity}, ${p.deliveryState}
${p.logisticsProvider ? `Logistics: ${p.logisticsProvider}\n` : ''}
${p.dispatchReference ? `Ref: ${p.dispatchReference}\n` : ''}
`;

  return { subject, html, text };
}
