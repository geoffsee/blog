import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Repo is published at https://geoffsee.github.io/blog/, so the
// production base path is /blog/. Override with VITE_BASE if you fork
// the repo or deploy under a different path (e.g. a custom domain → "/").
const base = process.env.VITE_BASE ?? '/blog/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
  },
});
