import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, mkdir, symlink, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {scanArtifacts} from '../src/artifacts.mjs';

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(),'privacy-guard-test-'));
  try { return await run(root); } finally { await rm(root,{recursive:true,force:true}); }
}
test('clean source is inspected without external services', () => fixture(async root => {
  await writeFile(path.join(root,'readme.md'),'public example');
  const result = await scanArtifacts(root);
  assert.equal(result.ok,true);assert.equal(result.filesChecked,1);
}));
test('environment files, key containers and symlinks are rejected without reading their contents', () => fixture(async root => {
  await mkdir(path.join(root,'nested'));
  for (const name of ['.env','.env.local','.dev.vars','id_rsa','key.pem','members.sqlite']) await writeFile(path.join(root,'nested',name),'fictional placeholder');
  await symlink(path.join(root,'nested'),path.join(root,'shortcut'));
  const result = await scanArtifacts(root);
  assert.equal(result.ok,false);assert.equal(result.violations.length,7);assert.equal(result.filesChecked,0);
  assert.equal(result.violations.some(v => v.rule === 'symlink'),true);
}));
test('credential-shaped synthetic samples are identified but never returned', () => fixture(async root => {
  const samples = ['-----BEGIN '+ 'PRIVATE KEY-----', 'gh' + 'p_' + 'Z'.repeat(36), 'AK' + 'IA' + 'Z'.repeat(16)];
  await writeFile(path.join(root,'bad.txt'),samples.join('\n'));
  const result = await scanArtifacts(root);
  assert.deepEqual(result.violations.map(v => v.rule),['private_key','github_token','aws_access_key']);
  for (const sample of samples) assert.equal(JSON.stringify(result).includes(sample),false);
}));
test('uninspected binary and oversized files cannot yield a successful scan', () => fixture(async root => {
  await writeFile(path.join(root,'binary.dat'),Buffer.from([0,1,2]));
  await writeFile(path.join(root,'large.txt'),'a'.repeat(65));
  const result = await scanArtifacts(root,{maxBytesPerFile:64});
  assert.deepEqual(result.violations.map(v => v.rule),['uninspected_binary','uninspected_large_file']);
}));
test('scan bounds and a symlink root fail explicitly', () => fixture(async root => {
  await writeFile(path.join(root,'one.txt'),'one');await writeFile(path.join(root,'two.txt'),'two');
  await assert.rejects(scanArtifacts(root,{maxEntries:1}),RangeError);
  await assert.rejects(scanArtifacts(root,{maxBytesPerFile:0}),TypeError);
  await symlink(path.join(root,'one.txt'),path.join(root,'alias'));
  await assert.rejects(scanArtifacts(path.join(root,'alias')),TypeError);
}));
test('empty files, exact size boundary and excluded dependency/history trees are explicit', () => fixture(async root => {
  await writeFile(path.join(root,'empty.txt'),'');
  await writeFile(path.join(root,'exact.txt'),'a'.repeat(64));
  for (const ignored of ['.git','node_modules']) {
    await mkdir(path.join(root,ignored));
    await writeFile(path.join(root,ignored,'.env'),'synthetic placeholder');
  }
  const result = await scanArtifacts(root,{maxBytesPerFile:64});
  assert.equal(result.ok,true);assert.equal(result.filesChecked,2);assert.equal(result.entriesChecked,2);
}));
