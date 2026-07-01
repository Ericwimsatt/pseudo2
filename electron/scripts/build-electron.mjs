import { build } from 'esbuild';
import { mkdir } from 'fs/promises';

await mkdir('dist-electron', { recursive: true });

await build({
  entryPoints: ['src/electron-main.ts'],
  outfile: 'dist-electron/main.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['electron', 'typescript'],
});

await build({
  entryPoints: ['src/electron-preload.ts'],
  outfile: 'dist-electron/preload.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['electron'],
});

console.log('Electron main + preload built successfully');
