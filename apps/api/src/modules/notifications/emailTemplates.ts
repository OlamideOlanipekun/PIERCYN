import {
  OrderCreatedPayload,
  ReceiptUploadedPayload,
  PaymentVerifiedPayload,
  ProductOutOfStockPayload,
} from './types';

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
  body { margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; -webkit-font-smoothing: antialiased; }
  .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px; box-sizing: border-box; }
  .card { background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 4px; padding: 32px 28px; }
  .header { border-bottom: 2px solid #1c1917; padding-bottom: 20px; margin-bottom: 24px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #1c1917; margin: 0; }
  .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #78716c; margin-top: 6px; }
  .h1 { font-size: 18px; font-weight: 600; color: #1c1917; margin: 0 0 16px 0; }
  .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
  .meta-grid td { padding: 8px 0; border-bottom: 1px solid #f5f5f4; }
  .meta-label { color: #78716c; width: 35%; font-weight: 500; }
  .meta-val { color: #1c1917; font-weight: 600; }
  .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  .table th { text-align: left; padding: 10px 8px; background: #fafaf9; border-bottom: 1px solid #e7e5e4; color: #78716c; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .table td { padding: 12px 8px; border-bottom: 1px solid #f5f5f4; color: #1c1917; }
  .total-row { font-weight: 700; font-size: 14px; background: #fafaf9; }
  .badge { display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
  .badge-dark { background: #1c1917; color: #ffffff; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #a8a29e; letter-spacing: 0.05em; }
  .button { display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 12px 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 2px; margin-top: 16px; }
`;

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
          <tr><td colspan="3" style="text-align: right; color: #78716c;">Subtotal</td><td style="text-align: right;">${escapeHtml(formatNGN(p.subtotalNGN))}</td></tr>
          ${p.discountNGN > 0 ? `<tr><td colspan="3" style="text-align: right; color: #78716c;">Discount</td><td style="text-align: right; color: #dc2626;">-${escapeHtml(formatNGN(p.discountNGN))}</td></tr>` : ''}
          <tr><td colspan="3" style="text-align: right; color: #78716c;">Delivery Fee</td><td style="text-align: right;">${p.deliveryFeeNGN > 0 ? escapeHtml(formatNGN(p.deliveryFeeNGN)) : 'Quote Pending'}</td></tr>
          <tr class="total-row"><td colspan="3" style="text-align: right;">Total</td><td style="text-align: right; color: #1c1917;">${escapeHtml(formatNGN(p.totalNGN))}</td></tr>
        </tbody>
      </table>
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
