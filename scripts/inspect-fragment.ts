#!/usr/bin/env node

/**
 * CLI inspection harness for fragment rendering.
 *
 * Usage:
 *   npx tsx scripts/inspect-fragment.ts <project-path> [file-path] [--html] [--tooltip] [--sidebar]
 *
 * Initializes the same services as production, renders the canonical file
 * fragment, and prints the HTML. Accepts fixture repository paths.
 * Does not require a visible Electron window.
 *
 * Options:
 *   --html    Print raw HTML without metadata
 *   --tooltip Print tooltip fragment instead of file fragment
 *   --sidebar Print sidebar fragment instead of file fragment
 */

import { resolve } from 'path';
import * as projectService from '../src/main/project/projectService';
import * as fragmentService from '../src/main/fragmentService';

async function main() {
  const args = process.argv.slice(2);
  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  if (positional.length < 1) {
    console.error('Usage: npx tsx scripts/inspect-fragment.ts <project-path> [file-path] [--html] [--tooltip] [--sidebar]');
    process.exit(1);
  }

  const projectPath = resolve(positional[0]);
  const filePath = positional[1];
  const htmlOnly = flags.includes('--html');
  const tooltipMode = flags.includes('--tooltip');
  const sidebarMode = flags.includes('--sidebar');

  await projectService.loadProject(projectPath);

  let fragment;
  if (sidebarMode) {
    fragment = await fragmentService.loadProjectAndRenderSidebar(projectPath, filePath ?? null);
  } else if (tooltipMode) {
    if (!filePath) {
      console.error('Tooltip mode requires a file path');
      process.exit(1);
    }
    // Populate the AST cache so the tooltip can resolve definitions/references.
    await fragmentService.renderFileFragment(filePath);
    fragment = await fragmentService.renderTooltipFragment(filePath, { refPos: 0 });
  } else {
    if (!filePath) {
      console.error('File mode requires a file path');
      process.exit(1);
    }
    fragment = await fragmentService.renderFileFragment(filePath);
  }

  if (htmlOnly) {
    process.stdout.write(fragment.html);
  } else {
    console.log(JSON.stringify(fragment, null, 2));
  }
}

main().catch((err) => {
  if (err instanceof Error && err.message.includes('ENOENT')) {
    console.error('Error: path not found');
  } else {
    console.error(err);
  }
  process.exit(1);
});
