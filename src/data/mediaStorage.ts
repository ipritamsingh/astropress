import { MediaItem } from '../types/cms';
import { optimizeImageFile } from './imageOptimizer';

const DB_NAME = 'astropress_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist binary Blob or Data URL to IndexedDB
 */
export async function persistMediaBlob(id: string, blobOrDataUrl: Blob | string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, data: blobOrDataUrl, timestamp: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not persist to IndexedDB:', err);
  }
}

/**
 * Retrieve binary Blob or Data URL from IndexedDB
 */
export async function getPersistedMediaBlob(id: string): Promise<Blob | string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not retrieve from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete binary Blob from IndexedDB
 */
export async function deletePersistedMediaBlob(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }
}

/**
 * Read image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 1200, height: 800 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Generate safe, unique filename preventing collisions
 */
export function sanitizeFilename(filename: string, existingNames: string[] = []): string {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : 'webp';
  let base = parts.join('.').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!base) base = 'upload-' + Date.now();

  let finalName = `${base}.${ext}`;
  let counter = 1;
  while (existingNames.includes(finalName)) {
    finalName = `${base}-${counter}.${ext}`;
    counter++;
  }
  return finalName;
}

/**
 * Process uploaded File into a valid MediaItem with automatic WebP conversion
 */
export async function processUploadedFile(
  file: File,
  existingNames: string[] = [],
  options: { webpQuality?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<MediaItem> {
  const id = 'med-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  // If it is a video or document, process normally
  if (!file.type.startsWith('image/')) {
    const safeName = sanitizeFilename(file.name, existingNames);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await persistMediaBlob(id, dataUrl);

        const sizeKb = Math.round(file.size / 1024);
        const sizeStr = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        resolve({
          id,
          name: safeName,
          url: dataUrl,
          type: file.type.startsWith('video/') ? 'video' : 'document',
          format: 'other',
          size: sizeStr,
          uploadDate: new Date().toISOString().split('T')[0],
          altText: baseNameToAlt(safeName),
          caption: `Uploaded asset: ${safeName}`,
        });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // Automatic WebP optimization for images
  const optimization = await optimizeImageFile(file, {
    quality: options.webpQuality || 0.82,
    maxWidth: options.maxWidth || 2560,
    maxHeight: options.maxHeight || 2560,
  });

  const safeName = sanitizeFilename(optimization.filename, existingNames);

  // Persist optimized dataUrl to IndexedDB for offline/instant access
  await persistMediaBlob(id, optimization.dataUrl);

  // Upload asset to server /public/uploads directory
  let finalUrl = optimization.dataUrl;
  try {
    const uploadRes = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: safeName,
        dataUrl: optimization.dataUrl,
      }),
    });
    if (uploadRes.ok) {
      const data = await uploadRes.json();
      if (data.url) {
        finalUrl = data.url;
      }
    }
  } catch (err) {
    console.warn('Server media upload unavailable, using blob storage', err);
  }

  const mediaItem: MediaItem = {
    id,
    name: safeName,
    url: finalUrl,
    type: 'image',
    format: optimization.format,
    size: optimization.optimizedSizeFormatted,
    originalSize: optimization.originalSizeFormatted,
    savingsPercentage: optimization.savingsPercentage,
    isWebpConverted: optimization.isWebpConverted,
    dimensions: `${optimization.width}x${optimization.height}`,
    uploadDate: new Date().toISOString().split('T')[0],
    altText: baseNameToAlt(safeName),
    caption: optimization.isWebpConverted
      ? `WebP optimized asset (Saved ${optimization.savingsPercentage}%)`
      : `Uploaded asset: ${safeName}`,
  };

  return mediaItem;
}

function baseNameToAlt(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
