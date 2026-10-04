export interface ImageOptimizationOptions {
  quality?: number; // 0.1 to 1.0 (default: 0.82)
  maxWidth?: number; // e.g. 2560
  maxHeight?: number; // e.g. 2560
  forceWebp?: boolean; // default true for raster formats
  retainOriginalFilename?: boolean;
}

export interface OptimizationResult {
  file: File | Blob;
  dataUrl: string;
  filename: string;
  originalFilename: string;
  format: 'webp' | 'svg' | 'gif' | 'png' | 'jpeg' | 'other';
  isWebpConverted: boolean;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  originalSizeFormatted: string;
  optimizedSizeFormatted: string;
  savingsPercentage: number;
  width: number;
  height: number;
  statusMessage: string;
}

/**
 * Format bytes to human readable string (KB or MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Clean and rename filename with .webp extension for converted assets
 */
export function getWebpFilename(originalName: string): string {
  const parts = originalName.split('.');
  if (parts.length <= 1) return `${originalName}.webp`;
  parts.pop(); // remove original extension
  const base = parts.join('.');
  return `${base}.webp`;
}

/**
 * Browser-side high-performance WebP image conversion and optimization engine.
 * Automatically converts JPG, PNG, and raster images to lightweight WebP files.
 * Preserves SVG and animated GIF files untouched.
 */
export async function optimizeImageFile(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> {
  const {
    quality = 0.82,
    maxWidth = 2560,
    maxHeight = 2560,
  } = options;

  const originalSizeBytes = file.size;
  const originalSizeFormatted = formatBytes(originalSizeBytes);
  const mimeType = file.type.toLowerCase();

  // 1. Preserve SVGs directly without rasterizing
  if (mimeType.includes('svg') || file.name.toLowerCase().endsWith('.svg')) {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      filename: file.name,
      originalFilename: file.name,
      format: 'svg',
      isWebpConverted: false,
      originalSizeBytes,
      optimizedSizeBytes: originalSizeBytes,
      originalSizeFormatted,
      optimizedSizeFormatted: originalSizeFormatted,
      savingsPercentage: 0,
      width: 800,
      height: 600,
      statusMessage: 'SVG preserved directly without rasterization',
    };
  }

  // 2. Preserve animated GIFs to prevent freezing frames
  if (mimeType.includes('gif') || file.name.toLowerCase().endsWith('.gif')) {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      filename: file.name,
      originalFilename: file.name,
      format: 'gif',
      isWebpConverted: false,
      originalSizeBytes,
      optimizedSizeBytes: originalSizeBytes,
      originalSizeFormatted,
      optimizedSizeFormatted: originalSizeFormatted,
      savingsPercentage: 0,
      width: 1200,
      height: 800,
      statusMessage: 'Animated GIF preserved without flattening',
    };
  }

  // 3. For JPG / PNG / WebP / BMP raster images: Convert & optimize to WebP via Canvas
  try {
    const img = await loadImageFromFile(file);
    let { width, height } = img;

    // Apply max bounds if image exceeds maxWidth / maxHeight while maintaining aspect ratio
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Create Canvas with alpha channel support (preserves PNG transparency)
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });

    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to WebP blob
    const webpBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
    });

    if (!webpBlob) {
      throw new Error('Failed to encode image to WebP');
    }

    const optimizedSizeBytes = webpBlob.size;
    const optimizedSizeFormatted = formatBytes(optimizedSizeBytes);
    const savingsPercentage = Math.max(
      0,
      Math.round(((originalSizeBytes - optimizedSizeBytes) / originalSizeBytes) * 100)
    );

    const webpFilename = getWebpFilename(file.name);
    const webpFile = new File([webpBlob], webpFilename, { type: 'image/webp' });
    const dataUrl = canvas.toDataURL('image/webp', quality);

    return {
      file: webpFile,
      dataUrl,
      filename: webpFilename,
      originalFilename: file.name,
      format: 'webp',
      isWebpConverted: true,
      originalSizeBytes,
      optimizedSizeBytes,
      originalSizeFormatted,
      optimizedSizeFormatted,
      savingsPercentage,
      width,
      height,
      statusMessage: `Converted to WebP (${savingsPercentage}% payload reduction)`,
    };
  } catch (err: any) {
    console.warn('WebP conversion fallback to original file:', err);
    const fallbackDataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl: fallbackDataUrl,
      filename: file.name,
      originalFilename: file.name,
      format: 'other',
      isWebpConverted: false,
      originalSizeBytes,
      optimizedSizeBytes: originalSizeBytes,
      originalSizeFormatted,
      optimizedSizeFormatted: originalSizeFormatted,
      savingsPercentage: 0,
      width: 1200,
      height: 800,
      statusMessage: `Preserved original: ${err.message || 'Browser fallback'}`,
    };
  }
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
