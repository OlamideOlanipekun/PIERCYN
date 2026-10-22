import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { COMMERCE_CONFIG } from '../../config/constants';

export const RECEIPT_BUCKET = 'payment-receipts';
export const ALLOWED_RECEIPT_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

let storageClient: SupabaseClient | null = null;

function getStorage(): SupabaseClient {
  if (storageClient) return storageClient;

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Receipt storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  storageClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return storageClient;
}

export function decodeReceiptBase64(fileBase64: string): Buffer {
  const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
  if (!base64Data || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data) || base64Data.length % 4 !== 0) {
    throw new Error('Receipt must be valid base64-encoded file data.');
  }
  return Buffer.from(base64Data, 'base64');
}

export function hasExpectedReceiptSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (mimeType === 'application/pdf') {
    return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  return false;
}

export function validateReceiptBuffer(
  buffer: Buffer,
  mimeType: string
): { valid: boolean; error?: string } {
  if (!ALLOWED_RECEIPT_TYPES.has(mimeType)) {
    return { valid: false, error: 'Receipt must be a JPEG, PNG or PDF file.' };
  }
  if (buffer.length === 0) {
    return { valid: false, error: 'Receipt file is empty.' };
  }
  if (buffer.length > COMMERCE_CONFIG.LIMITS.MAX_RECEIPT_BYTES) {
    return { valid: false, error: 'Receipt must be 3 MB or smaller.' };
  }
  if (!hasExpectedReceiptSignature(buffer, mimeType)) {
    return { valid: false, error: 'Receipt contents do not match the declared file type.' };
  }
  return { valid: true };
}

export function receiptExtension(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  return 'pdf';
}

async function ensureBucket(): Promise<void> {
  const storage = getStorage();
  const { data, error } = await storage.storage.getBucket(RECEIPT_BUCKET);
  if (data && !error) return;

  const { error: createError } = await storage.storage.createBucket(RECEIPT_BUCKET, {
    public: false,
    fileSizeLimit: COMMERCE_CONFIG.LIMITS.MAX_RECEIPT_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_RECEIPT_TYPES),
  });
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Unable to prepare private receipt storage: ${createError.message}`);
  }
}

export async function uploadReceipt(
  orderId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  await ensureBucket();
  const path = `receipts/${orderId}/${crypto.randomUUID()}.${receiptExtension(mimeType)}`;

  const { error } = await getStorage().storage.from(RECEIPT_BUCKET).upload(path, buffer, {
    cacheControl: '0',
    upsert: false,
    contentType: mimeType,
  });
  if (error) {
    throw new Error(`Receipt upload failed: ${error.message}`);
  }
  return path;
}

export async function createReceiptSignedUrl(path: string, expiresInSeconds = 300): Promise<string> {
  const { data, error } = await getStorage()
    .storage.from(RECEIPT_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(`Unable to create receipt link: ${error?.message || 'unknown error'}`);
  }
  return data.signedUrl;
}

export async function removeReceipt(path: string): Promise<void> {
  const { error } = await getStorage().storage.from(RECEIPT_BUCKET).remove([path]);
  if (error) {
    console.error('[RECEIPT_DELETE]', error.message);
  }
}
