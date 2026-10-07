import { lstat, readdir, open, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const forbiddenName = /^(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|id_(?:rsa|ed25519|ecdsa))$|\.(?:pem|key|p12|pfx|sqlite|sqlite3|db)$/i;
const signatures = [
  ['private_key', /-----BEGIN(?:[ \t]+(?:RSA|EC|DSA|OPENSSH|ENCRYPTED))?[ \t]+PRIVATE KEY-----/],
  ['github_token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['aws_access_key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/]
];

/** Offline pre-publication check. Reports paths/rules, never matched values. */
export async function scanArtifacts(directory, {maxEntries = 10000, maxBytesPerFile = 1048576} = {}) {
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || !Number.isSafeInteger(maxBytesPerFile) || maxBytesPerFile < 1) {
    throw new TypeError('Invalid scan bounds');
  }
  const root = path.resolve(directory);
  if ((await lstat(root)).isSymbolicLink()) throw new TypeError('Scan root must not be a symlink');
  const canonicalRoot = await realpath(root);
  const violations = [];
  let entriesChecked = 0, filesChecked = 0;
  async function visit(folder) {
    const names = (await readdir(folder)).sort();
    for (const name of names) {
      if (name === '.git' || name === 'node_modules') continue;
      if (++entriesChecked > maxEntries) throw new RangeError('Artifact entry bound exceeded');
      const file = path.join(folder, name);
      const relative = path.relative(root, file).split(path.sep).join('/');
      const info = await lstat(file);
      if (info.isSymbolicLink()) { violations.push({path: relative, rule: 'symlink'}); continue; }
      if (forbiddenName.test(name)) { violations.push({path: relative, rule: 'sensitive_filename'}); continue; }
      if (info.isDirectory()) { await visit(file); continue; }
      if (!info.isFile()) { violations.push({path: relative, rule: 'unsupported_entry'}); continue; }
      if (info.size > maxBytesPerFile) { violations.push({path: relative, rule: 'uninspected_large_file'}); continue; }
      const resolved = await realpath(file);
      if (!resolved.startsWith(canonicalRoot + path.sep)) { violations.push({path: relative, rule: 'outside_root'}); continue; }
      const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
      try {
        const current = await handle.stat();
        if (!current.isFile() || current.size > maxBytesPerFile || current.ino !== info.ino || current.dev !== info.dev) {
          violations.push({path: relative, rule: 'changed_or_large_file'}); continue;
        }
        const buffer = Buffer.alloc(maxBytesPerFile + 1);
        let bytesRead = 0;
        while (bytesRead < buffer.length) {
          const part = await handle.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);
          if (part.bytesRead === 0) break;
          bytesRead += part.bytesRead;
        }
        if (bytesRead > maxBytesPerFile) { violations.push({path: relative, rule: 'changed_or_large_file'}); continue; }
        const after = await handle.stat();
        if (after.size !== current.size || after.mtimeMs !== current.mtimeMs || after.ctimeMs !== current.ctimeMs || bytesRead !== after.size) {
          violations.push({path: relative, rule: 'changed_during_scan'}); continue;
        }
        filesChecked++;
        const bytes = buffer.subarray(0, bytesRead);
        if (bytes.includes(0)) { violations.push({path: relative, rule: 'uninspected_binary'}); continue; }
        const content = bytes.toString('utf8');
        for (const [rule, pattern] of signatures) if (pattern.test(content)) violations.push({path: relative, rule});
      } finally { await handle.close(); }
    }
  }
  await visit(root);
  return {ok: violations.length === 0, entriesChecked, filesChecked, violations};
}
