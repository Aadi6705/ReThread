/**
 * WebSocket helper utility for ReThread campus real-time messaging.
 * Uses environment variable NEXT_PUBLIC_WS_URL in production,
 * falling back to local backend in development.
 */

export function getWebSocketUrl(token?: string): string {
  const defaultBase =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? `wss://${window.location.hostname}:8000/api/v1/ws`
      : 'ws://127.0.0.1:8000/api/v1/ws';

  const base = process.env.NEXT_PUBLIC_WS_URL || defaultBase;
  if (!token) return base;

  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  url.searchParams.set('token', token);
  return url.toString();
}

