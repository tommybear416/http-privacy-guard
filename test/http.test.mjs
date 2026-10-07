import test from 'node:test';
import assert from 'node:assert/strict';
import {GuardError, DEFAULT_CSP, assertSameOrigin, guardMutation, hardenResponseHeaders, preventPrivateCaching} from '../src/index.mjs';

const origin = 'https://portal.example.test';
const request = (method, headers = {}, url = origin + '/profile') => new Request(url, {method, headers});
const denied = (fn, code) => assert.throws(fn, error => error instanceof GuardError && error.code === code);

test('cache-only integration preserves application browser policy without adding a CSP', () => {
  const source = new Headers({'Cache-Control':'public, max-age=600','Referrer-Policy':'strict-origin-when-cross-origin'});
  const result = preventPrivateCaching(source);
  assert.equal(result.get('cache-control'),'private, no-store');
  assert.equal(result.has('content-security-policy'),false);
  assert.equal(result.has('x-frame-options'),false);
  assert.equal(result.get('referrer-policy'),source.get('referrer-policy'));
  assert.equal(source.get('cache-control'),'public, max-age=600');
});

test('private is the default even when the original response claims public caching', () => {
  const original = new Headers({'cache-control':'public, max-age=3600','etag':'private-version','age':'45','last-modified':'Wed, 01 Jan 2025 00:00:00 GMT'});
  const headers = hardenResponseHeaders(original);
  assert.equal(headers.get('cache-control'), 'private, no-store');
  for (const name of ['cdn-cache-control','surrogate-control']) assert.equal(headers.get(name), 'no-store');
  assert.equal(headers.get('x-robots-tag'), 'noindex, nofollow');
  for (const name of ['etag','age','last-modified']) assert.equal(headers.has(name), false);
  assert.equal(original.get('etag'), 'private-version');
  assert.equal(headers.get('content-security-policy'), DEFAULT_CSP);
});
test('explicit public resources keep caching, but a Set-Cookie response fails closed', () => {
  assert.equal(hardenResponseHeaders({'cache-control':'public, max-age=60'}, {visibility:'public'}).get('cache-control'), 'public, max-age=60');
  assert.equal(hardenResponseHeaders({'set-cookie':'demo=value; HttpOnly','cache-control':'public'}, {visibility:'public'}).get('cache-control'), 'private, no-store');
  assert.equal(hardenResponseHeaders({}, {visibility:'public'}).has('cache-control'), false);
});
test('existing policies are not overwritten and Vary is merged without duplicates', () => {
  const headers = hardenResponseHeaders({'content-security-policy':"default-src 'none'; sandbox",'vary':'Accept-Encoding, cookie','x-frame-options':'SAMEORIGIN','x-content-type-options':'invalid'});
  assert.equal(headers.get('content-security-policy'), "default-src 'none'; sandbox");
  assert.equal(headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('vary'), 'Accept-Encoding, cookie, Authorization');
  assert.equal(hardenResponseHeaders({'vary':'*'}).get('vary'), '*');
});
test('HSTS requires explicit configuration and HTTPS', () => {
  assert.equal(hardenResponseHeaders({}, {url:origin, hstsMaxAge:31536000}).get('strict-transport-security'), 'max-age=31536000');
  assert.equal(hardenResponseHeaders({}, {url:'http://localhost:8080',hstsMaxAge:31536000}).has('strict-transport-security'), false);
  assert.equal(hardenResponseHeaders().has('strict-transport-security'), false);
  denied(() => hardenResponseHeaders({}, {hstsMaxAge:0}), 'invalid_hsts');
  denied(() => hardenResponseHeaders({}, {hstsMaxAge:63072001}), 'invalid_hsts');
  denied(() => hardenResponseHeaders({}, {hstsMaxAge:5,url:'invalid'}), 'invalid_hsts_url');
});
test('invalid policy configuration fails instead of silently treating it as public', () => {
  for (const visibility of ['PRIVATE', 'unknown', null, false]) denied(() => hardenResponseHeaders({}, {visibility}), 'invalid_visibility');
  for (const csp of ['',null, 'default-src\r\nanything']) denied(() => hardenResponseHeaders({}, {csp}), 'invalid_csp');
});
for (const method of ['POST','PUT','PATCH','DELETE']) test(`same-origin ${method} is accepted`, () => {
  assert.doesNotThrow(() => guardMutation(request(method, {origin, 'sec-fetch-site':'same-origin'}), origin));
  assert.doesNotThrow(() => assertSameOrigin(request(method, {origin}), origin));
});
for (const attacker of ['', 'null','https://attacker.example.test','https://sub.portal.example.test', origin + '/path', origin + ':443']) {
  test(`rejects missing, malformed or different browser origin: ${attacker || 'missing'}`, () => {
    const headers = attacker ? {origin:attacker} : {};
    denied(() => guardMutation(request('POST',headers),origin), 'origin_denied');
  });
}
test('a rewritten request URL and hostile fetch metadata cannot bypass the origin guard', () => {
  denied(() => guardMutation(request('POST',{origin},'https://attacker.example.test/profile'),origin), 'origin_denied');
  for (const site of ['cross-site','same-site','none']) denied(() => guardMutation(request('POST',{origin,'sec-fetch-site':site}),origin), 'origin_denied');
});
test('read methods cannot pass a mutation-only guard', () => {
  for (const method of ['GET','HEAD','OPTIONS']) denied(() => guardMutation(request(method,{origin}),origin), 'method_denied');
});
test('server origin configuration is canonical and contains no credentials or path', () => {
  for (const value of ['invalid',origin+'/',origin+'/api','ftp://portal.example.test','https://name:pass@portal.example.test']) denied(() => assertSameOrigin(request('POST',{origin}),value), 'invalid_origin_configuration');
  denied(() => assertSameOrigin({url:'invalid',headers:new Headers()},origin), 'invalid_request');
});
