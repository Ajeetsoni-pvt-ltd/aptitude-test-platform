/**
 * Image Utility Functions
 * Handles image caching, validation, and URL manipulation
 */

/**
 * Generates a cache-busted image URL by adding a timestamp query parameter
 * This ensures the browser fetches the latest version of the image
 * @param imageUrl - The original image URL
 * @param forceRefresh - If true, adds current timestamp to force cache miss
 * @returns Cache-busted URL or original URL if invalid
 */
export const getCacheBustedImageUrl = (imageUrl: string | undefined, forceRefresh = false): string | undefined => {
  if (!imageUrl) return undefined;

  try {
    const url = new URL(imageUrl, window.location.origin);
    
    if (forceRefresh) {
      // Add timestamp for forced cache miss
      url.searchParams.set('v', Date.now().toString());
    }
    
    return url.toString();
  } catch (error) {
    console.warn('[getCacheBustedImageUrl] Invalid URL:', imageUrl, error);
    return imageUrl;
  }
};

export const getApiOrigin = (): string => {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api';
  const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
  const absoluteBaseUrl = new URL(normalizedBaseUrl, window.location.origin);

  if (absoluteBaseUrl.pathname.endsWith('/api')) {
    absoluteBaseUrl.pathname = absoluteBaseUrl.pathname.slice(0, -4) || '/';
  }

  absoluteBaseUrl.search = '';
  absoluteBaseUrl.hash = '';
  return absoluteBaseUrl.toString().replace(/\/$/, '');
};

export const normalizeImageUrl = (imageUrl: string | undefined): string | undefined => {
  const trimmed = imageUrl?.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `${window.location.protocol}${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\/res\.cloudinary\.com/i, 'https://res.cloudinary.com');
  }

  const uploadPath = trimmed.startsWith('/uploads')
    ? trimmed
    : trimmed.startsWith('uploads/')
      ? `/${trimmed}`
      : undefined;

  if (uploadPath) {
    return `${getApiOrigin()}${uploadPath}`;
  }

  try {
    return new URL(trimmed, window.location.origin).toString();
  } catch (error) {
    console.warn('[normalizeImageUrl] Invalid URL:', imageUrl, error);
    return undefined;
  }
};

/**
 * Validates if an image URL is accessible and returns proper headers
 * @param imageUrl - URL to validate
 * @returns Promise<boolean> - Whether image is accessible
 */
export const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
  if (!imageUrl) return false;

  try {
    const response = await fetch(imageUrl, { method: 'HEAD', mode: 'cors' });
    return response.ok;
  } catch (error) {
    console.warn('[validateImageUrl] Cannot validate image:', imageUrl, error);
    return false;
  }
};

/**
 * Gets user initials as fallback avatar
 * @param name - Full name
 * @returns Two-letter initials
 */
export const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Determines the optimal image format and size for profile pictures
 * @param originalFormat - Original image format
 * @returns Optimized format recommendation
 */
export const getOptimalImageFormat = (originalFormat: string): 'webp' | 'jpeg' | 'png' => {
  const lowerFormat = originalFormat.toLowerCase();
  
  if (lowerFormat.includes('webp')) return 'webp';
  if (lowerFormat.includes('jpg') || lowerFormat.includes('jpeg')) return 'jpeg';
  if (lowerFormat.includes('png')) return 'png';
  
  return 'webp'; // Default to WebP (better compression)
};

/**
 * Logs image-related debug information
 * @param label - Debug label
 * @param data - Data to log
 */
export const logImageDebug = (label: string, data: unknown): void => {
  if (import.meta.env.DEV) {
    console.log(`[ImageDebug:${label}]`, data);
  }
};

/**
 * Checks if image URL is from Cloudinary
 * @param imageUrl - Image URL to check
 * @returns boolean
 */
export const isCloudinaryUrl = (imageUrl: string | undefined): boolean => {
  if (!imageUrl) return false;
  return imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com');
};

/**
 * Checks if image URL is local/relative
 * @param imageUrl - Image URL to check
 * @returns boolean
 */
export const isLocalImageUrl = (imageUrl: string | undefined): boolean => {
  if (!imageUrl) return false;
  return imageUrl.startsWith('/uploads') || !imageUrl.includes('http');
};
