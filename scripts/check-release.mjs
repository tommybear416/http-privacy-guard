import {scanArtifacts} from '../src/artifacts.mjs';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname,'..');
const result = await scanArtifacts(root);
const pkg = JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
if (Object.keys(pkg.dependencies || {}).length !== 0 || pkg.scripts.preinstall || pkg.scripts.install || pkg.scripts.postinstall) throw new Error('Unexpected runtime dependency or installation script');
for (const file of await readdir(path.join(root,'src'))) if (!/\.(?:mjs|d\.ts)$/.test(file)) throw new Error('Unexpected source artifact');
console.log(JSON.stringify(result));
if (!result.ok) process.exitCode = 1;
