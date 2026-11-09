import dotenv from 'dotenv';
dotenv.config();

import { getSmtpConfig, getMailTransporter, sanitizeError } from '../apps/api/src/modules/notifications/emailConfig';
import {
  renderWelcomeEmail,
  renderOrderCreatedEmail,
  renderReceiptUploadedEmail,
  renderPaymentVerifiedEmail,
  renderPaymentDecisionEmail,
  renderDeliveryQuoteCreatedEmail,
  renderQuoteDecisionEmail,
  renderFulfilmentEmail,
} from '../apps/api/src/modules/notifications/emailTemplates';

async function runSmtpAudit() {
  console.log('====================================================');
  console.log('PIERCYN — GMAIL SMTP CONFIGURATION & TEMPLATE AUDIT');
  console.log('====================================================\n');

  // 1. Inspect Environment Variables
  const config = getSmtpConfig();
  console.log('1. SMTP Configuration Check:');
  console.log(`• Host:      ${config?.host || process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
  console.log(`• Port:      ${config?.port || process.env.SMTP_PORT || '587 (default)'}`);
  console.log(`• User:      ${config?.user || process.env.SMTP_USER || '[NOT SET]'}`);
  console.log(`• Pass:      ${config?.pass ? '[CONFIGURED - REDACTED]' : '[NOT SET]'}`);
  console.log(`• From:      ${config?.fromName || 'PIERCYN'} <${config?.fromEmail || config?.user || '[NOT SET]'}>`);
  console.log(`• Reply-To:  ${config?.replyTo || config?.fromEmail || '[NOT SET]'}`);
  console.log(`• Secure:    ${config?.secure ?? false} (requireTLS: ${!(config?.secure ?? false)})\n`);

  // 2. Validate Template Rendering
  console.log('2. Transactional Template Rendering Test:');
  try {
    const welcome = renderWelcomeEmail({ firstName: 'Adaeze', email: 'client@example.com' });
    console.log(`  ✓ Welcome Email: "${welcome.subject}" (${welcome.html.length} bytes HTML)`);

    const orderCreated = renderOrderCreatedEmail({
      orderId: 'test-order-1',
      orderNumber: 'PC-20261110-001',
      customerName: 'Adaeze Okonkwo',
      customerEmail: 'client@example.com',
      customerPhone: '+2348012345678',
      deliveryAddress: '12 Admiralty Way',
      deliveryCity: 'Lekki',
      deliveryState: 'Lagos',
      items: [
        {
          name: 'Architectural Linen Overshirt',
          sku: 'PC-SHIRT-01',
          size: 'M',
          colour: 'Bone',
          quantity: 1,
          unitPriceNGN: 4500000,
          totalNGN: 4500000,
        },
      ],
      subtotalNGN: 4500000,
      deliveryFeeNGN: 350000,
      discountNGN: 0,
      totalNGN: 4850000,
      paymentMethod: 'BANK_TRANSFER',
      createdAt: new Date().toISOString(),
    });
    console.log(`  ✓ Order Created (Bank Transfer): "${orderCreated.subject}" (${orderCreated.html.length} bytes HTML)`);

    const receipt = renderReceiptUploadedEmail({
      orderId: 'test-order-1',
      orderNumber: 'PC-20261110-001',
      customerName: 'Adaeze Okonkwo',
      customerEmail: 'client@example.com',
      customerPhone: '+2348012345678',
      totalNGN: 4850000,
      providerReference: 'MONIEPOINT-REF-99281',
      receiptPath: 'receipts/test.pdf',
      uploadedAt: new Date().toISOString(),
      reviewDeadlineAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    });
    console.log(`  ✓ Receipt Uploaded: "${receipt.subject}" (${receipt.html.length} bytes HTML)`);

    const paymentVerified = renderPaymentVerifiedEmail({
      orderId: 'test-order-1',
      orderNumber: 'PC-20261110-001',
      customerName: 'Adaeze Okonkwo',
      customerEmail: 'client@example.com',
      customerPhone: '+2348012345678',
      amountNGN: 4850000,
      paymentMethod: 'Direct Bank Transfer',
      providerReference: 'MONIEPOINT-REF-99281',
      verifiedAt: new Date().toISOString(),
      verificationSource: 'ADMIN_APPROVAL',
      verifiedBy: 'ADMIN-1',
    });
    console.log(`  ✓ Payment Verified: "${paymentVerified.subject}" (${paymentVerified.html.length} bytes HTML)`);

    const paymentRejected = renderPaymentDecisionEmail(
      {
        orderId: 'test-order-1',
        orderNumber: 'PC-20261110-001',
        customerName: 'Adaeze Okonkwo',
        customerEmail: 'client@example.com',
        customerPhone: '+2348012345678',
        paymentType: 'PRODUCT',
        amountNGN: 4850000,
        providerReference: 'REF-12345',
        rejectionReason: 'Transfer amount mismatch; expected ₦48,500 but received ₦40,000.',
        verifiedBy: 'ADMIN-1',
        timestamp: new Date().toISOString(),
      },
      false
    );
    console.log(`  ✓ Payment Rejected: "${paymentRejected.subject}" (${paymentRejected.html.length} bytes HTML)`);

    const quoteCreated = renderDeliveryQuoteCreatedEmail({
      orderId: 'test-order-1',
      orderNumber: 'PC-20261110-001',
      customerName: 'Adaeze Okonkwo',
      customerEmail: 'client@example.com',
      customerPhone: '+2348012345678',
      deliveryFeeNGN: 350000,
      subtotalNGN: 4500000,
      totalNGN: 4850000,
      quoteId: 'quote-1',
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      decisionUrl: 'https://piercyn.vercel.app/account/orders/test-order-1/delivery',
    });
    console.log(`  ✓ Delivery Quote: "${quoteCreated.subject}" (${quoteCreated.html.length} bytes HTML)`);

    const quoteDecision = renderQuoteDecisionEmail(
      {
        orderId: 'test-order-1',
        orderNumber: 'PC-20261110-001',
        customerName: 'Adaeze Okonkwo',
        customerEmail: 'client@example.com',
        customerPhone: '+2348012345678',
        deliveryFeeNGN: 350000,
        subtotalNGN: 4500000,
        totalNGN: 4850000,
        quoteId: 'quote-1',
        expiresAt: new Date().toISOString(),
        decisionUrl: '',
      },
      'ACCEPTED'
    );
    console.log(`  ✓ Quote Decision: "${quoteDecision.subject}" (${quoteDecision.html.length} bytes HTML)`);

    const fulfilment = renderFulfilmentEmail(
      {
        orderId: 'test-order-1',
        orderNumber: 'PC-20261110-001',
        customerName: 'Adaeze Okonkwo',
        customerEmail: 'client@example.com',
        customerPhone: '+2348012345678',
        deliveryAddress: '12 Admiralty Way',
        deliveryCity: 'Lekki',
        deliveryState: 'Lagos',
        logisticsProvider: 'GIG Logistics',
        dispatchReference: 'GIG-998822',
        timestamp: new Date().toISOString(),
      },
      'DISPATCHED'
    );
    console.log(`  ✓ Fulfilment (Dispatched): "${fulfilment.subject}" (${fulfilment.html.length} bytes HTML)`);
    console.log('  All transactional templates rendered cleanly with brand identity.\n');
  } catch (err) {
    console.error('  ✗ Template rendering failed:', sanitizeError(err));
    process.exit(1);
  }

  // 3. SMTP Verification
  console.log('3. Live SMTP Connection Verification:');
  if (!config) {
    console.log('  ⚠️  SMTP credentials not set in current environment (.env).');
    console.log('  ℹ️  To connect live Gmail SMTP, set in Vercel Dashboard / .env:');
    console.log('      SMTP_HOST=smtp.gmail.com');
    console.log('      SMTP_PORT=587');
    console.log('      SMTP_USER=piercyn@gmail.com');
    console.log('      SMTP_PASSWORD=<Google App Password>');
    console.log('      SMTP_FROM_EMAIL=piercyn@gmail.com');
    console.log('      SMTP_FROM_NAME=PIERCYN');
    console.log('      SMTP_REPLY_TO=piercyn@gmail.com');
    console.log('\nStatus: CONFIGURATION REQUIRED (Awaiting Gmail App Password in Vercel)');
    return;
  }

  const transporter = getMailTransporter();
  if (!transporter) {
    console.error('  ✗ Transporter initialization returned null.');
    return;
  }

  try {
    await transporter.verify();
    console.log(`  ✓ Live SMTP Connected successfully to ${config.host}:${config.port} as ${config.user}`);

    // Check if an authorized test recipient was provided: e.g. --to=piercyn@gmail.com
    const toArg = process.argv.find((a) => a.startsWith('--to='));
    if (toArg) {
      const recipient = toArg.split('=')[1];
      console.log(`\n4. Sending test email to ${recipient}...`);
      const testEmail = renderWelcomeEmail({ firstName: 'Test Recipient', email: recipient });
      const result = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        replyTo: config.replyTo,
        to: recipient,
        subject: `[TEST] ${testEmail.subject}`,
        html: testEmail.html,
        text: testEmail.text,
      });
      console.log(`  ✓ Sent successfully! Message ID: ${result.messageId}`);
    } else {
      console.log('\n  (To send a live test message, re-run with: npx tsx scripts/test-smtp.ts --to=<authorized_email>)');
    }
  } catch (err) {
    console.error(`  ✗ SMTP Verification Failed: ${sanitizeError(err)}`);
  }
}

runSmtpAudit();
