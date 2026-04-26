// GitHub Pages serves 404.html for unknown paths. Copying index.html as
// 404.html lets the SPA router handle deep links like /blog/posts/foo.
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const index = join(dist, 'index.html');
const fallback = join(dist, '404.html');

if (!existsSync(index)) {
  console.error(`[postbuild] missing ${index}`);
  process.exit(1);
}

copyFileSync(index, fallback);
console.log(`[postbuild] wrote ${fallback}`);
