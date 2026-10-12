type OrderNotification = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalNGN: number;
  status: 'ORDER_PLACED' | 'PAYMENT_CONFIRMED';
};

export class WhatsAppNotificationService {
  /**
   * Optional WhatsApp Cloud API alert to the store operator.
   * Checkout/payment must not fail if notifications are unconfigured or unavailable.
   * Configure a WhatsApp Business Cloud API token, phone-number ID and an opted-in
   * recipient in the server environment. Do not put these secrets in VITE_* vars.
   */
  public static async notifyOrderEvent(order: OrderNotification): Promise<void> {
    const accessToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const recipient = process.env.WHATSAPP_ADMIN_PHONE_NUMBER;
    const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v22.0';

    if (!accessToken || !phoneNumberId || !recipient) {
      return;
    }

    const statusLabel = order.status === 'PAYMENT_CONFIRMED'
      ? 'PAYMENT CONFIRMED'
      : 'NEW ORDER — PAYMENT PENDING';
    const amount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(order.totalNGN);
    const message = [
      `PIERCYN: ${statusLabel}`,
      `Order: ${order.orderNumber}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Total: ${amount}`,
      'Review the order in the PIERCYN admin dashboard.',
    ].join('\n');

    try {
      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipient,
            type: 'text',
            text: { preview_url: false, body: message },
          }),
          signal: AbortSignal.timeout(8000),
        },
      );

      if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        console.error('[WHATSAPP_NOTIFICATION_FAILED]', response.status, responseText.slice(0, 500));
      }
    } catch (error) {
      console.error('[WHATSAPP_NOTIFICATION_ERROR]', error);
    }
  }
}
