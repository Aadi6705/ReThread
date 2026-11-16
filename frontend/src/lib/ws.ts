/**
 * WebSocket helper utility for ReThread campus real-time messaging.
 * Uses environment variable NEXT_PUBLIC_WS_URL in production,
 * falling back to local backend in development.
 */

export function getWebSocketUrl(token?: string): string {
  // 1. Explicit WebSocket URL override
  let base = process.env.NEXT_PUBLIC_WS_URL;

  // 2. Derive from NEXT_PUBLIC_API_URL (e.g. Railway backend domain)
  if (!base && process.env.NEXT_PUBLIC_API_URL) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    const wsProto = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
    const hostPart = apiUrl.replace(/^https?:\/\//, '');
    if (hostPart.endsWith('/api/v1') || hostPart.endsWith('/v1')) {
      base = `${wsProto}//${hostPart.replace(/\/v1$/, '')}/api/v1/ws`;
    } else {
      base = `${wsProto}//${hostPart}/api/v1/ws`;
    }
  }

  // 3. Fallback for local development or same-host deployments
  if (!base) {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
    base = isHttps ? `wss://${host}/api/v1/ws` : `ws://${host}:8000/api/v1/ws`;
  }

  // Attach token from argument or localStorage
  const effectiveToken =
    token || (typeof window !== 'undefined' ? localStorage.getItem('rethread_access_token') : null);

  if (!effectiveToken) return base;

  try {
    const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    url.searchParams.set('token', effectiveToken);
    return url.toString();
  } catch {
    return `${base}${base.includes('?') ? '&' : '?'}token=${encodeURIComponent(effectiveToken)}`;
  }
}

