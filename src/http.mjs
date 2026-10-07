import { GuardError } from './error.mjs';

export const DEFAULT_CSP = "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const BASE = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none'
});

function trustedOrigin(value) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new GuardError('invalid_origin_configuration', 500); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || value !== parsed.origin) {
    throw new GuardError('invalid_origin_configuration', 500);
  }
  return parsed.origin;
}

/** Both request and expectedOrigin must come from server-owned routing. */
export function assertSameOrigin(request, expectedOrigin) {
  const expected = trustedOrigin(expectedOrigin);
  let actual;
  try { actual = new URL(request.url).origin; } catch { throw new GuardError('invalid_request', 400); }
  if (actual !== expected || request.headers?.get('origin') !== expected) {
    throw new GuardError('origin_denied');
  }
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') throw new GuardError('origin_denied');
}

/** A browser write guard; it does not authenticate a session or service client. */
export function guardMutation(request, expectedOrigin) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request?.method)) throw new GuardError('method_denied', 405);
  assertSameOrigin(request, expectedOrigin);
}

function vary(headers) {
  const existing = (headers.get('vary') || '').split(',').map(v => v.trim()).filter(Boolean);
  if (existing.includes('*')) return;
  for (const name of ['Cookie', 'Authorization']) {
    if (!existing.some(v => v.toLowerCase() === name.toLowerCase())) existing.push(name);
  }
  headers.set('Vary', existing.join(', '));
}

/** Cache-only boundary for applications that already own their browser/CSP policy. */
export function preventPrivateCaching(input) {
  const headers = new Headers(input);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('CDN-Cache-Control', 'no-store');
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  headers.set('Vercel-CDN-Cache-Control', 'no-store');
  headers.set('Surrogate-Control', 'no-store');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  for (const name of ['Age', 'ETag', 'Last-Modified']) headers.delete(name);
  vary(headers);
  return headers;
}

/** Policy is trusted server configuration, never a request header or query. */
export function hardenResponseHeaders(input, {visibility = 'private', csp = DEFAULT_CSP, url, hstsMaxAge} = {}) {
  if (!['private', 'public'].includes(visibility)) throw new GuardError('invalid_visibility', 500);
  if (typeof csp !== 'string' || !csp.trim() || /[\r\n]/.test(csp)) throw new GuardError('invalid_csp', 500);
  if (hstsMaxAge !== undefined && (!Number.isSafeInteger(hstsMaxAge) || hstsMaxAge < 1 || hstsMaxAge > 63072000)) {
    throw new GuardError('invalid_hsts', 500);
  }
  let headers = new Headers(input);
  for (const [name, value] of Object.entries(BASE)) if (!headers.has(name)) headers.set(name, value);
  headers.set('X-Content-Type-Options', 'nosniff');
  if (!headers.has('Content-Security-Policy')) headers.set('Content-Security-Policy', csp);
  const sensitive = visibility === 'private' || headers.has('set-cookie');
  if (sensitive) headers = preventPrivateCaching(headers);
  if (hstsMaxAge !== undefined) {
    let parsed;
    try { parsed = new URL(url); } catch { throw new GuardError('invalid_hsts_url', 500); }
    if (parsed.protocol === 'https:') headers.set('Strict-Transport-Security', `max-age=${hstsMaxAge}`);
  }
  return headers;
}
