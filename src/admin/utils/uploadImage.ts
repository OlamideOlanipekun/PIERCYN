import { supabase } from '../../lib/supabaseClient';

/**
 * Uploads a File to Supabase Storage and returns the public URL.
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
  const ext = file.name.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = folder ? `${folder}/${uniqueName}` : uniqueName;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('Could not retrieve public URL after upload.');
  }

  return data.publicUrl;
}
