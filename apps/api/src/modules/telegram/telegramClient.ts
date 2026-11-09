export interface TelegramResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
  parameters?: {
    retry_after?: number;
  };
}

export class TelegramClient {
  private botToken: string | undefined;

  constructor(token?: string) {
    this.botToken = token !== undefined ? token : process.env.TELEGRAM_BOT_TOKEN;
  }

  get isConfigured(): boolean {
    return Boolean(this.botToken && this.botToken.trim().length > 0);
  }

  async call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
    if (!this.botToken) {
      throw new Error('[TELEGRAM_CLIENT_UNCONFIGURED] TELEGRAM_BOT_TOKEN environment variable is not set');
    }

    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as TelegramResponse<T>;

    if (!response.ok || !result.ok) {
      const error = new Error(result.description || `Telegram API call ${method} failed with status ${response.status}`);
      Object.assign(error, {
        status: response.status,
        errorCode: result.error_code,
        retryAfter: result.parameters?.retry_after,
      });
      throw error;
    }

    return result.result as T;
  }

  async sendMessage(params: {
    chatId: string;
    text: string;
    parseMode?: 'HTML' | 'MarkdownV2';
    disableWebPagePreview?: boolean;
  }) {
    return this.call('sendMessage', {
      chat_id: params.chatId,
      text: params.text,
      parse_mode: params.parseMode ?? 'HTML',
      disable_web_page_preview: params.disableWebPagePreview ?? true,
    });
  }

  async setWebhook(params: { url: string; secretToken?: string }) {
    return this.call('setWebhook', {
      url: params.url,
      secret_token: params.secretToken,
      allowed_updates: ['message'],
    });
  }

  async getMe() {
    return this.call('getMe', {});
  }
}

export const telegramClient = new TelegramClient();
