/**
 * Restores the dev template (index.source.html) over index.html.
 * The published branch root may contain a built index.html committed by CI;
 * local dev/build must always start from the Vite entry template.
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'index.source.html');
const target = path.join(root, 'index.html');

if (existsSync(source)) {
  copyFileSync(source, target);
  console.log('[prepare] index.html restored from index.source.html');
} else {
  console.warn('[prepare] index.source.html not found, leaving index.html untouched');
}
