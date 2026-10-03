import { Capacitor } from '@capacitor/core';

// The live cloud deployment URL hosting the backend MTProto server
export const DEFAULT_REMOTE_BACKEND = 'https://ais-dev-jerx2loq5b76kwmk4eyf3m-80533556186.asia-southeast1.run.app';
const STORAGE_KEY_CUSTOM_BACKEND = 'telecall_backend_url';

export function getCustomBackendUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_BACKEND);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    // Ignore localStorage errors
  }
  return '';
}

export function setCustomBackendUrl(url: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_BACKEND, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_BACKEND);
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Returns the correct base URL for API calls.
 * - On Native Android/iOS (Capacitor WebView), requests to relative '/api/...'
 *   fail with "Unexpected token '<', <html>" because the local asset server has no API routes.
 *   Hence, we route API calls to the live cloud backend.
 * - In the browser, we use the current window location or relative paths.
 */
export function getApiBaseUrl(): string {
  const custom = getCustomBackendUrl();
  if (custom) {
    return custom.replace(/\/+$/, '');
  }

  // Detect Capacitor native platform or file/capacitor scheme or local static server (without port 3000)
  const isNative = Capacitor.isNativePlatform();
  const isCapacitorScheme = typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && window.location.port !== '3000')
  );

  if (isNative || isCapacitorScheme) {
    return DEFAULT_REMOTE_BACKEND;
  }

  // Standard web browser preview: use same origin
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/**
 * Resolves a full API URL given a route path (e.g. '/api/telegram/status')
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return cleanPath;
  return `${base}${cleanPath}`;
}
