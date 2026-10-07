import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
assert.ok(argv.length === 0 || (argv.length === 2 && argv[0] === '--output'), 'Usage: node scripts/build-advisory-evidence.mjs [--output NEW_DIRECTORY]');
const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trimEnd();
assert.equal(git('status', '--porcelain'), '', 'Build evidence from a clean checkout');
const head = git('rev-parse', 'HEAD');
const commits = {
  '0.1.0': 'd25480e04d9b687306b0a9b4509d459f9283c9cc',
  '0.1.1': '6556b78de2133286e981b4e22feb6325da2f1538'
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readGit = (commit, name) => execFileSync('git', ['show', `${commit}:${name}`], {cwd: root});
const out = argv.length ? path.resolve(argv[1]) : await mkdtemp(path.join(os.tmpdir(), 'privacy-guard-advisory-'));
if (argv.length) await mkdir(out); // Refuse to overwrite an existing directory.
const receipt = {
  schemaVersion: 1, advisory: 'GHSA-mjww-fjrv-p72m',
  project: 'https://github.com/tommybear416/http-privacy-guard',
  sourceCommits: commits, sourceTrees: {}, evidenceCommit: head,
  maintainer: {name: 'Yitong Chen', handle: 'tommybear416', role: 'security maintainer and disclosure coordinator', aiAssisted: true},
  independentlyAcceptedReport: false, cveAssignmentClaimed: false, files: {}
};
for (const [version, commit] of Object.entries(commits)) {
  assert.equal(JSON.parse(readGit(commit, 'package.json')).version, version);
  receipt.sourceTrees[version] = git('rev-parse', `${commit}^{tree}`);
  await mkdir(path.join(out, 'sources', version), {recursive: true});
  for (const [source, destination] of [['src/http.mjs', 'http.mjs'], ['src/error.mjs', 'error.mjs'], ['LICENSE', 'LICENSE']]) {
    const name = `sources/${version}/${destination}`;
    const bytes = readGit(commit, source);
    await writeFile(path.join(out, name), bytes);
    receipt.files[name] = sha(bytes);
  }
}
const verifier = await readFile(path.join(root, 'scripts', 'reproduce-cache-precedence.mjs'));
await writeFile(path.join(out, 'reproduce.mjs'), verifier);
receipt.files['reproduce.mjs'] = sha(verifier);
const readme = `# Offline evidence: GHSA-mjww-fjrv-p72m

This archive contains the exact HTTP implementation and error class from two public commits, their MIT licenses, a verifier and recorded results. No package installation, network access, website login, credentials or member records are required. Node.js 22 or later is required.

Run from the extracted directory:

    node reproduce.mjs

Expected result: source checksums verified; six private-boundary cases fail in 0.1.0 and pass in 0.1.1; two explicit public controls pass in each. Exit 0 means this expected before/after regression is reproduced, not that version 0.1.0 is secure. The evidence builder also confirms that changing a source file causes checksum verification to reject it before import.

Sources:
- 0.1.0: ${commits['0.1.0']}
- 0.1.1 fix: ${commits['0.1.1']}
- Evidence tools: ${head}

The same clone with these commits can regenerate the evidence using node scripts/build-advisory-evidence.mjs --output NEW_DIRECTORY. source-receipt.json records exact SHA-256 hashes and Git tree IDs. SHA256SUMS verifies files against the recorded snapshot; hashes are not an independent audit or identity certification.

This is an offline reproduction of contradictory origin response headers. It does not execute a real CDN or establish actual leakage. Cache consequences require an origin guard that executes before the caching decision, an otherwise cache-eligible response, and applicable provider/cache-key rules. Set-Cookie cases demonstrate the library's private path, not proof that a provider caches such responses. Explicit platform caching rules can override origin policies. Previously cached data may require a separate operator-controlled purge.

Yitong Chen (tommybear416) coordinates this project's AI-assisted remediation and disclosure. There is no independently accepted third-party report, CVE assignment or downstream adoption claimed by this archive.
`;
await writeFile(path.join(out, 'README.md'), readme);
receipt.files['README.md'] = sha(readme);
await writeFile(path.join(out, 'source-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
const run = () => spawnSync(process.execPath, [path.join(out, 'reproduce.mjs')], {encoding: 'utf8'});
const original = run();
assert.equal(original.status, 0, original.stderr);
const proof = JSON.parse(original.stdout);
const tamperFile = path.join(out, 'sources', '0.1.1', 'http.mjs');
const intact = await readFile(tamperFile);
try {
  await writeFile(tamperFile, Buffer.concat([intact, Buffer.from('\n// synthetic checksum negative control\n')]));
  const rejected = run();
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /checksum_mismatch/);
} finally { await writeFile(tamperFile, intact); }
const restored = run();
assert.equal(restored.status, 0, restored.stderr);
assert.equal(restored.stdout, original.stdout, 'Restored evidence must reproduce the same result');
await writeFile(path.join(out, 'results.json'), JSON.stringify({...proof, checksumTamperRejected: true}, null, 2) + '\n');
const names = [...Object.keys(receipt.files), 'source-receipt.json', 'results.json'].sort();
const sums = [];
for (const name of names) sums.push(`${sha(await readFile(path.join(out, name)))}  ${name}`);
await writeFile(path.join(out, 'SHA256SUMS'), sums.join('\n') + '\n');
console.log(JSON.stringify({
  ok: true, advisory: receipt.advisory, evidenceCommit: head, sourceCommits: commits,
  before: {privateFailed: 6, publicPassed: 2}, after: {privatePassed: 6, privateFailed: 0, publicPassed: 2},
  checksumTamperRejected: true, output: out
}));
