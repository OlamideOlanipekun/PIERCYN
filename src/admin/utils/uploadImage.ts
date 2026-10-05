const ADMIN_TOKEN_KEY = 'piercyn_admin_token';
const RAW_API_URL = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');
const ADMIN_API_BASE = RAW_API_URL ? `${RAW_API_URL}/api/admin` : '/api/admin';

/**
 * Uploads a File to Supabase Storage via the backend admin endpoint.
 *
 * The file is base64-encoded in the browser and sent to POST /api/admin/upload-image,
 * where the server uses the Supabase service_role key to upload — bypassing RLS policies.
 *
 * @param file    - The File object selected by the user
 * @param bucket  - The Supabase storage bucket name (default: 'products')
 * @param folder  - Optional subfolder within the bucket (default: '')
 * @returns       - The public URL of the uploaded file
 */
export async function uploadImageToSupabase(
  file: File,
  bucket = 'products',
  folder = ''
): Promise<string> {
  // Convert file to base64
  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  const res = await fetch(`${ADMIN_API_BASE}/upload-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, 'x-admin-token': token } : {}),
    },
    body: JSON.stringify({
      fileBase64,
      fileName: file.name,
      mimeType: file.type,
      bucket,
      folder,
    }),
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Image upload failed: server returned status ${res.status}`);
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Image upload failed with status ${res.status}`);
  }

  return json.data.publicUrl;
}
