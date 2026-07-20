import { build, context } from 'esbuild';
import { mkdir } from 'fs/promises';

const watchMode = process.argv.includes('--watch');

await mkdir('dist-electron', { recursive: true });

const mainOptions = {
  entryPoints: ['src/main/index.ts'],
  outfile: 'dist-electron/main.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron', 'typescript'],
  sourcemap: true,
};

const preloadOptions = {
  entryPoints: ['src/main/preload.ts'],
  outfile: 'dist-electron/preload.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron'],
  sourcemap: true,
};

if (watchMode) {
  const mainCtx = await context({
    ...mainOptions,
    plugins: [{
      name: 'rebuild-notify',
      setup(build) {
        build.onEnd(() => {
          console.log('Electron main + preload built successfully');
        });
      },
    }],
  });
  const preloadCtx = await context(preloadOptions);
  await Promise.all([mainCtx.watch(), preloadCtx.watch()]);
  console.log('Watching for changes...');
} else {
  await build(mainOptions);
  await build(preloadOptions);
  console.log('Electron main + preload built successfully');
}
