/**
 * Official Meta WhatsApp Cloud API Service for PIERCYN
 * Sends transactional WhatsApp messages to customers and merchants.
 * Gracefully logs and falls back if WhatsApp Cloud API credentials are unset.
 */

export interface SendWhatsAppMessageParams {
  to: string; // E.164 phone number e.g. +2348012345678
  body: string;
}

export class WhatsAppService {
  private static phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  private static accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  private static merchantPhone = process.env.MERCHANT_WHATSAPP_PHONE || '+2348140000000';

  /**
   * Normalize any Nigerian or international phone to E.164.
   */
  public static normalizePhone(raw: string): string | null {
    if (!raw) return null;
    const stripped = raw.replace(/[\s\-().]/g, '');

    if (stripped.startsWith('+')) {
      const digits = stripped.slice(1).replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
      return null;
    }

    if (/^0[7-9][0-1]\d{8}$/.test(stripped)) {
      return `+234${stripped.slice(1)}`;
    }

    if (/^234[7-9][0-1]\d{8}$/.test(stripped)) {
      return `+${stripped}`;
    }

    return null;
  }

  /**
   * Send text message via Meta Cloud API
   */
  public static async sendMessage(params: SendWhatsAppMessageParams): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
    const normalizedTo = this.normalizePhone(params.to);
    if (!normalizedTo) {
      console.warn(`[WHATSAPP_SEND_SKIPPED] Invalid recipient phone: "${params.to}"`);
      return { success: false, error: 'Invalid phone number' };
    }

    // Strip leading '+' for Meta API
    const recipientDigits = normalizedTo.replace(/^\+/, '');

    if (!this.phoneNumberId || !this.accessToken) {
      console.info(`[WHATSAPP_SIMULATED_DISPATCH] To: ${normalizedTo}\nContent:\n${params.body}`);
      return { success: true, simulated: true };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientDigits,
          type: 'text',
          text: {
            preview_url: true,
            body: params.body,
          },
        }),
      });

      const data: any = await response.json();
      if (!response.ok) {
        console.error('[WHATSAPP_API_ERROR]', data);
        return { success: false, error: data?.error?.message || 'WhatsApp Cloud API request failed' };
      }

      const messageId = data?.messages?.[0]?.id;
      return { success: true, messageId };
    } catch (err: any) {
      console.error('[WHATSAPP_SEND_EXCEPTION]', err);
      return { success: false, error: err.message };
    }
  }

  public static async sendToMerchant(body: string) {
    return this.sendMessage({
      to: this.merchantPhone,
      body,
    });
  }
}

