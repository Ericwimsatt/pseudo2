/**
 * Headless smoke test. Exercises the full translation pipeline
 * against the in-memory sample repository so we can verify the
 * application logic without a browser.
 *
 * Run with:  npx tsx packages/app/scripts/smoke-test.ts
 */

import { createAppController } from "../src/controllers/index.js";
import { createInMemoryFileSystem } from "../src/infrastructure/index.js";
import { SAMPLE_FILES } from "../src/hooks/sample-files.js";

const main = async () => {
  const controller = createAppController();
  const fs = createInMemoryFileSystem("Sample", SAMPLE_FILES);
  const repo = await controller.repository.load(fs);
  const files = repo.files();
  console.log(`Loaded ${files.length} files:`);
  for (const f of files) {
    console.log(`  - ${f.path} (${f.sizeBytes}b, ${f.language})`);
  }

  for (const file of files) {
    if (file.language !== "typescript") continue;
    controller.navigation.selectFile(file.id);
    await controller.translation.translate(file.id);
    const graph = repo.getSemanticGraph(file.id);
    const lines = repo.getEnglish(file.id);
    console.log(`\n=== ${file.path} ===`);
    console.log(`AST nodes:      ${repo.getParseTree(file.id)?.astNodeCount ?? 0}`);
    console.log(`Semantic nodes: ${graph?.nodes.length ?? 0}`);
    console.log(`English lines:  ${lines.length}`);
    for (const line of lines) {
      console.log(`  [${String(line.lineIndex).padStart(2, " ")}] ${line.text}`);
    }
  }
  controller.dispose();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
