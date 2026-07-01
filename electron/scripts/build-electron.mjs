import { build } from 'esbuild';
import { mkdir } from 'fs/promises';

await mkdir('dist-electron', { recursive: true });

await build({
  entryPoints: ['src/electron-main.ts'],
  outfile: 'dist-electron/main.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron', 'typescript'],
});

await build({
  entryPoints: ['src/electron-preload.ts'],
  outfile: 'dist-electron/preload.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron'],
});

console.log('Electron main + preload built successfully');
