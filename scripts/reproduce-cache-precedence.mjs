import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, lstat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Offline review of origin response headers. This never contacts a CDN.
const root = path.resolve(process.argv[2] ?? import.meta.dirname);
const receipt = JSON.parse(await readFile(path.join(root, 'source-receipt.json'), 'utf8'));
const commits = {
  '0.1.0': 'd25480e04d9b687306b0a9b4509d459f9283c9cc',
  '0.1.1': '6556b78de2133286e981b4e22feb6325da2f1538'
};
assert.equal(receipt.advisory, 'GHSA-mjww-fjrv-p72m');
assert.deepEqual(receipt.sourceCommits, commits);
const files = ['README.md', 'reproduce.mjs'];
for (const version of Object.keys(commits)) {
  files.push(`sources/${version}/http.mjs`, `sources/${version}/error.mjs`, `sources/${version}/LICENSE`);
}
assert.deepEqual(Object.keys(receipt.files).sort(), files.sort());
for (const name of files) {
  const file = path.join(root, name);
  assert.ok((await lstat(file)).isFile(), 'Evidence must contain ordinary files');
  const hash = createHash('sha256').update(await readFile(file)).digest('hex');
  assert.equal(hash, receipt.files[name], `checksum_mismatch: ${name}`);
}

const providers = [
  ['Cloudflare', 'Cloudflare-CDN-Cache-Control'],
  ['Vercel', 'Vercel-CDN-Cache-Control']
];
const originalPolicy = 'public, max-age=300';
const results = [];
for (const version of Object.keys(commits)) {
  const api = await import(pathToFileURL(path.join(root, 'sources', version, 'http.mjs')));
  const cases = [];
  for (const [provider, target] of providers) {
    for (const boundary of ['cache-only', 'default-private', 'public-with-cookie', 'explicit-public']) {
      const isPublic = boundary === 'explicit-public';
      const input = new Headers({
        [target]: originalPolicy,
        'Cache-Control': 'public, max-age=900',
        'CDN-Cache-Control': 'public, max-age=600',
        'Content-Security-Policy': "default-src 'none'; sandbox"
      });
      if (boundary === 'public-with-cookie') input.set('Set-Cookie', 'demo=synthetic; HttpOnly; Secure; SameSite=Strict');
      const original = [...input];
      const output = boundary === 'cache-only'
        ? api.preventPrivateCaching(input)
        : api.hardenResponseHeaders(input, {visibility: boundary.startsWith('public') || isPublic ? 'public' : 'private'});
      assert.deepEqual([...input], original, 'Caller inputs must be preserved');
      assert.equal(output.get('Content-Security-Policy'), input.get('Content-Security-Policy'));
      assert.deepEqual(output.getSetCookie(), input.getSetCookie());
      const expectedTarget = isPublic ? originalPolicy : 'no-store';
      const expectedBrowser = isPublic ? 'public, max-age=900' : 'private, no-store';
      cases.push({
        provider, boundary, scope: isPublic ? 'public-control' : 'private',
        expectedTarget, observedTarget: output.get(target),
        observedBrowserPolicy: output.get('Cache-Control'),
        observedGenericCdnPolicy: output.get('CDN-Cache-Control'),
        passed: output.get(target) === expectedTarget && output.get('Cache-Control') === expectedBrowser
      });
    }
  }
  results.push({
    version, sourceCommit: commits[version], cases,
    privatePassed: cases.filter(c => c.scope === 'private' && c.passed).length,
    privateFailed: cases.filter(c => c.scope === 'private' && !c.passed).length,
    publicPassed: cases.filter(c => c.scope === 'public-control' && c.passed).length
  });
}
assert.equal(results[0].privatePassed, 0);
assert.equal(results[0].privateFailed, 6);
assert.equal(results[0].publicPassed, 2);
assert.equal(results[1].privatePassed, 6);
assert.equal(results[1].privateFailed, 0);
assert.equal(results[1].publicPassed, 2);
console.log(JSON.stringify({
  advisory: receipt.advisory, sourceChecksumsVerified: true,
  matchesKnownRegression: true, results,
  limitations: ['Offline origin-header reproduction only', 'No live CDN execution or observed data leakage', 'The cookie case demonstrates library behavior, not platform cache eligibility', 'No independent reviewer acceptance is established']
}, null, 2));
