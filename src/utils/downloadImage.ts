/**
 * Client helper to trigger native file downloads for images across desktop and mobile.
 * Uses a three-tier approach:
 * 1. Client-side blob fetch (fastest, preserves filename, works if CDN supports CORS)
 * 2. HTML5 Canvas export fallback
 * 3. Server-side proxy with Content-Disposition: attachment (bulletproof for all browsers/cross-origin)
 */
export async function downloadProductImage(
  imageUrl: string,
  suggestedFilename: string
): Promise<boolean> {
  if (!imageUrl) return false;

  // Enhance Unsplash images to high-res for affiliates if applicable
  let downloadUrl = imageUrl;
  if (downloadUrl.includes('images.unsplash.com')) {
    try {
      const u = new URL(downloadUrl);
      u.searchParams.set('w', '1600');
      u.searchParams.set('q', '90');
      downloadUrl = u.toString();
    } catch {
      // keep original if url parse fails
    }
  }

  const cleanBase = suggestedFilename.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+$/, '');
  const finalFilename = `${cleanBase || 'piercyn-piece'}.jpg`;

  // Strategy 1: Direct fetch + blob (works directly in browser when CORS allows)
  try {
    const res = await fetch(downloadUrl, { mode: 'cors', cache: 'no-cache' });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = objectUrl;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);
        } catch {}
      }, 2000);
      return true;
    }
  } catch {
    // Continue to strategy 2
  }

  // Strategy 2: HTML5 Canvas export
  try {
    const canvasSuccess = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(false);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = finalFilename;
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                try {
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch {}
              }, 2000);
              resolve(true);
            } else {
              resolve(false);
            }
          }, 'image/jpeg', 0.95);
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = downloadUrl;
    });

    if (canvasSuccess) return true;
  } catch {
    // Continue to strategy 3
  }

  // Strategy 3: Serverless proxy with Content-Disposition: attachment
  try {
    const proxyUrl = `/api/download/image?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(finalFilename)}`;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = finalFilename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {}
    }, 2000);
    return true;
  } catch (err) {
    console.error('[IMAGE_DOWNLOAD_FAILED]', err);
    window.open(downloadUrl, '_blank');
    return false;
  }
}
