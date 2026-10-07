import test from 'node:test';
import assert from 'node:assert/strict';
import {hardenResponseHeaders, preventPrivateCaching} from '../src/index.mjs';

// Model only the documented origin-header precedence, not a live CDN.
const providers = [
  ['Cloudflare', 'Cloudflare-CDN-Cache-Control'],
  ['Vercel', 'Vercel-CDN-Cache-Control']
];
const originalPolicy = 'public, max-age=300';
const effectivePolicy = (headers, specific) =>
  headers.get(specific) ?? headers.get('CDN-Cache-Control') ?? headers.get('Cache-Control');

for (const [provider, specific] of providers) {
  for (const [boundary, guard] of [
    ['cache-only', input => preventPrivateCaching(input)],
    ['default private', input => hardenResponseHeaders(input)],
    ['public response with a cookie', input => hardenResponseHeaders(input, {visibility: 'public'})]
  ]) {
    test(`${provider} targeted cache policy cannot override ${boundary} privacy`, () => {
      const input = new Headers({
        [specific.toLowerCase()]: originalPolicy,
        'CDN-Cache-Control': 'public, max-age=600',
        'Cache-Control': 'public, max-age=900',
        'Content-Security-Policy': "default-src 'none'; sandbox"
      });
      if (boundary === 'public response with a cookie') input.append('Set-Cookie', 'demo=synthetic; HttpOnly');
      const result = guard(input);
      assert.equal(effectivePolicy(result, specific), 'no-store', 'the most specific CDN policy must deny storage');
      assert.equal(result.get('Cache-Control'), 'private, no-store');
      assert.equal(result.get('Content-Security-Policy'), input.get('Content-Security-Policy'));
      assert.deepEqual(result.getSetCookie(), input.getSetCookie());
      assert.equal(input.get(specific), originalPolicy, 'the caller input remains unchanged');
    });
  }
  test(`${provider} explicitly public cookie-free caching remains available`, () => {
    const input = new Headers({[specific]: originalPolicy, 'Cache-Control': 'public, max-age=900'});
    const result = hardenResponseHeaders(input, {visibility: 'public'});
    assert.equal(effectivePolicy(result, specific), originalPolicy);
    assert.equal(result.get('Cache-Control'), 'public, max-age=900');
  });
}
