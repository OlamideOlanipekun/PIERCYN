import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  adminEmail: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
}

export function getSmtpConfig(): SmtpConfig | null {
  const user = process.env.SMTP_USER || '';
  // Support SMTP_PASSWORD (spec), SMTP_APP_PASSWORD, and SMTP_PASS as aliases
  const pass = (
    process.env.SMTP_PASSWORD ||
    process.env.SMTP_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    ''
  ).replace(/\s+/g, '');
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || user;

  if (!user || !pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  // Default to 587 (STARTTLS) for Gmail App Password compatibility
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1'
    : port === 465;

  const fromEmail = process.env.SMTP_FROM_EMAIL || user;
  const fromName = process.env.SMTP_FROM_NAME || 'PIERCYN';
  const replyTo = process.env.SMTP_REPLY_TO || fromEmail;

  return {
    host,
    port,
    secure,
    user,
    pass,
    adminEmail: adminEmail || user,
    fromEmail,
    fromName,
    replyTo,
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
    // requireTLS ensures STARTTLS upgrade on port 587
    requireTLS: !config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    socketTimeout: 20000,
  });

  // Non-blocking SMTP connection validation on first transporter creation
  cachedTransporter.verify().then(() => {
    console.log(`[SMTP] ✓ Connected ${config.host}:${config.port} as ${config.user}`);
  }).catch((err: unknown) => {
    console.warn(`[SMTP] ✗ Connection failed: ${sanitizeError(err)}`);
  });

  return cachedTransporter;
}

/**
 * Returns the SMTP config for the dedicated customer-facing sender (piercyn@gmail.com).
 * Reads from the same SMTP_* environment variables as getSmtpConfig().
 * Named separately so the two paths can be split to independent env var blocks
 * in the future without touching call sites.
 */
export function getCustomerSmtpConfig(): SmtpConfig | null {
  return getSmtpConfig();
}

let cachedCustomerTransporter: Transporter | null = null;

/**
 * Returns a nodemailer transporter for customer-facing transactional emails.
 * Used by OutboxProcessor exclusively. Cached independently of the admin
 * transporter so both can be active at the same time.
 */
export function getCustomerMailTransporter(): Transporter | null {
  const config = getCustomerSmtpConfig();
  if (!config) {
    return null;
  }

  if (cachedCustomerTransporter) {
    return cachedCustomerTransporter;
  }

  cachedCustomerTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    socketTimeout: 20000,
  });

  // Non-blocking SMTP connection validation on first transporter creation
  cachedCustomerTransporter.verify().then(() => {
    console.log(`[SMTP_CUSTOMER] ✓ Connected ${config.host}:${config.port} as ${config.user} (customer sender)`);
  }).catch((err: unknown) => {
    console.warn(`[SMTP_CUSTOMER] ✗ Connection failed: ${sanitizeError(err)}`);
  });

  return cachedCustomerTransporter;
}

export function sanitizeError(error: unknown): string {
  if (!error) return 'Unknown error';
  const msg = error instanceof Error ? error.message : String(error);
  // Strip any accidental credential strings or app passwords
  return msg
    .replace(/[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}/gi, '[REDACTED_PASSWORD]')
    .replace(/SMTP_PASSWORD[^&\s]*/gi, 'SMTP_PASSWORD=[REDACTED]')
    .slice(0, 1000);
}
