// Mirrors ../assets into web/public/assets so Vite serves them under /assets/.
// Runs before dev and build via npm pre-hooks.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..');
const src = join(webRoot, '..', 'assets');
const dest = join(webRoot, 'public', 'assets');

if (!existsSync(src)) {
  console.warn(`[sync-assets] no source dir at ${src}, skipping`);
  process.exit(0);
}

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[sync-assets] copied ${src} -> ${dest}`);
