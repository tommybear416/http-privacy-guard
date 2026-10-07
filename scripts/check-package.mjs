import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {scanArtifacts} from '../src/artifacts.mjs';

// The tarball and extracted synthetic consumer live outside the release tree.
const root = path.resolve(import.meta.dirname,'..');
const temporary = await mkdtemp(path.join(os.tmpdir(),'privacy-guard-package-'));
try {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const [pack] = JSON.parse(execFileSync(npm,['pack','--ignore-scripts','--json','--cache',path.join(temporary,'npm-cache'),'--pack-destination',temporary],{cwd:root,encoding:'utf8'}));
  for (const {path: name} of pack.files) {
    if (!/^(?:src\/[^/]+\.(?:mjs|d\.ts)|docs\/[^/]+\.md|README\.md|SECURITY\.md|MAINTAINERS\.md|LICENSE|package\.json)$/.test(name)) {
      throw new Error(`Unexpected packaged path: ${name}`);
    }
  }
  execFileSync('tar',['-xzf',path.join(temporary,pack.filename),'-C',temporary]);
  const extracted = path.join(temporary,'package');
  const scan = await scanArtifacts(extracted);
  if (!scan.ok) throw new Error('Packaged artifact scan failed');
  const pkg = JSON.parse(await readFile(path.join(extracted,'package.json'),'utf8'));
  const runtime = await import(pathToFileURL(path.join(extracted,pkg.exports['.'].import)));
  const headers = runtime.hardenResponseHeaders({'Cache-Control':'public, max-age=600'});
  if (headers.get('cache-control') !== 'private, no-store') throw new Error('Packaged privacy control failed');
  const subject = {id:'synthetic-owner',tenantId:'synthetic-team',verified:true};
  const resource = {id:'synthetic-document',tenantId:subject.tenantId,ownerId:subject.id};
  runtime.authorizeResource(subject,resource,{action:'download'});
  let denied = false;
  try { runtime.authorizeResource({...subject,id:'synthetic-other'},resource,{action:'download'}); }
  catch (error) { denied = error instanceof runtime.GuardError && error.status === 404; }
  if (!denied) throw new Error('Packaged account boundary failed');
  for (const [,entry] of Object.entries(pkg.exports)) {
    if (!entry.types || !(await readFile(path.join(extracted,entry.types),'utf8')).includes('export')) throw new Error('Missing packaged type declarations');
  }
  console.log(JSON.stringify({ok:true,files:pack.files.length,bytes:pack.size,integrity:pack.integrity,runtime:'packaged import',sourceFiles:await readdir(path.join(extracted,'src'))}));
} finally { await rm(temporary,{recursive:true,force:true}); }
