/**
 * Verify the translation pipeline against a real file from the
 * stemwise repo (read via the dev-fs API). Confirms the parser,
 * semantic adapter, and English renderer all work end-to-end
 * against real-world code.
 *
 * Run with the dev server up:
 *   npm run dev   (in packages/app)
 *   npx tsx packages/app/scripts/stemwise-smoke-test.ts
 */

import { createAppController } from "../src/controllers/index.js";
import { createInMemoryFileSystem } from "../src/infrastructure/index.js";
import { asFileId } from "@source-narrator/shared";

const main = async () => {
  const controller = createAppController();
  const files: { path: string; content: string }[] = [];
  const targetPaths = [
    "src/App.tsx",
    "src/main.tsx",
    "src/contexts/AuthContext.tsx",
    "src/components/InventoryBanner.tsx",
    "src/integrations/supabase/client.ts",
    "supabase/functions/send-invoice-email/index.ts",
  ];
  for (const p of targetPaths) {
    const url = `http://localhost:3001/api/dev-fs/read?path=${encodeURIComponent(p)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Skipping ${p}: ${res.status}`);
      continue;
    }
    const content = await res.text();
    files.push({ path: p, content });
  }
  const fs = createInMemoryFileSystem("stemwise", files);
  const repo = await controller.repository.load(fs);
  console.log(`Loaded ${repo.metadata.fileCount} stemwise files\n`);

  for (const f of repo.files()) {
    controller.navigation.selectFile(f.id);
    await controller.translation.translate(f.id);
    const graph = repo.getSemanticGraph(f.id);
    const lines = repo.getEnglish(f.id);
    const unknownCount = graph?.nodes.filter((n) => n.kind === "unknown").length ?? 0;
    console.log(`=== ${f.path} ===`);
    console.log(`  size:        ${f.sizeBytes}b`);
    console.log(`  AST nodes:   ${repo.getParseTree(f.id)?.astNodeCount ?? 0}`);
    console.log(`  Semantic:    ${graph?.nodes.length ?? 0}`);
    console.log(`  English:     ${lines.length} lines`);
    console.log(`  Unknowns:    ${unknownCount}`);
    console.log("");
    for (const line of lines.slice(0, 12)) {
      console.log(`    [${String(line.lineIndex).padStart(2, " ")}] ${line.text}`);
    }
    if (lines.length > 12) console.log(`    ... ${lines.length - 12} more lines`);
    console.log("");
  }
  controller.dispose();
  void asFileId;
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
