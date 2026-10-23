import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  adminEmail: string;
}

export function getSmtpConfig(): SmtpConfig | null {
  const user = process.env.SMTP_USER || '';
  const pass = (process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || user;

  if (!user || !pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1'
    : port === 465;

  return {
    host,
    port,
    secure,
    user,
    pass,
    adminEmail: adminEmail || user,
  };
}

let cachedTransporter: Transporter | null = null;

export function getMailTransporter(): Transporter | null {
  const config = getSmtpConfig();
  if (!config) {
    return null;
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    socketTimeout: 20000,
  });

  return cachedTransporter;
}

export function sanitizeError(error: unknown): string {
  if (!error) return 'Unknown error';
  const msg = error instanceof Error ? error.message : String(error);
  // Strip any accidental credential strings or app passwords
  return msg
    .replace(/[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}/gi, '[REDACTED_PASSWORD]')
    .slice(0, 1000);
}
