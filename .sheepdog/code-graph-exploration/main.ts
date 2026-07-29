import { checkpoint, run_command, runAgentStep, createSliceWorkspace } from '@sheepdog/sandbox'

const taskDir = '.sheepdog/code-graph-exploration'

const slicedWorkspace = await createSliceWorkspace({
  name: 'code-graph-exploration',
  seeds: {
    taskDescription:
      'Build a standalone code graph engine with ts-morph Project AST parsing, call/import graphs, min-cut partitioning, IPC graph service, and Cytoscape UI. Do not use makeSemanticGraph.',
    files: [
      'src/main/preload.ts',
      'src/main/index.ts',
      'src/shared/api.ts',
      'src/App/App.tsx',
      'package.json',
    ],
  },
  alwaysInclude: [
    '.sheepdog/code-graph-exploration/**',
    'test/fixtures/**',
    'src/main/preload.ts',
    'src/main/index.ts',
    'src/shared/api.ts',
    'src/App/App.tsx',
    'src/App/components/Sidebar.tsx',
  ],
  budget: 20000,
})

console.log(`[sliced-workspace] ${slicedWorkspace}`)

async function verify(command: string, timeout = 300_000): Promise<void> {
  const result = await run_command({ command, cwd: slicedWorkspace, timeout })
  if (result.exitCode !== 0) {
    console.error(result.stdout)
    console.error(result.stderr)
    process.exit(result.exitCode)
  }
}

async function runPhase(name: string, planFile: string, verifyCommands: string[]): Promise<void> {
  await checkpoint(name)
  const { completed } = await runAgentStep({
    agent: 'opencode',
    cwd: slicedWorkspace,
    on_verification_fail: 'fix',
    checkpoint_on_complete: true,
    nudgeInterval: 300,
    plan: `You are working in a SLICED git worktree. Your cwd is already ${slicedWorkspace}.
All edits must stay inside this worktree. Do not edit the parent repo.

Read ${taskDir}/overview.md and ${taskDir}/${planFile}.
Implement that phase completely using ts-morph (NOT makeSemanticGraph).

After implementation, run these verification commands until they pass:
${verifyCommands.map(c => `- ${c}`).join('\n')}

When the phase and its verification are complete, call sheepdog_done.`,
  })

  if (!completed) process.exit(1)

  for (const cmd of verifyCommands) {
    const timeout = cmd.includes('playwright') || cmd.includes('e2e') || cmd.includes('smoke') ? 600_000 : 300_000
    await verify(cmd, timeout)
  }
}

try {
  await runPhase('phase-1-graph-engine', 'phase-1-graph-engine.md', [
    'npm run test:typecheck',
    'npm run test:lint',
    'npx vitest run test/unit/graph/',
  ])

  await runPhase('phase-2-ipc-graph-service', 'phase-2-ipc-graph-service.md', [
    'npm run test:typecheck',
    'npm run test:lint',
    'npx vitest run test/unit/graph/',
  ])

  await runPhase('phase-3-ui-integration', 'phase-3-ui-integration.md', [
    'npm run test:typecheck',
    'npm run test:lint',
    'npx vitest run test/unit/graph/',
  ])

  await runPhase('phase-4-min-cut-visualization', 'phase-4-min-cut-visualization.md', [
    'npm run test:typecheck',
    'npm run test:lint',
    'npx vitest run test/unit/graph/',
  ])

  await runPhase('phase-5-polish-agent-debug', 'phase-5-polish-agent-debug.md', [
    'npm run test:typecheck',
    'npm run test:lint',
    'npx vitest run test/unit/graph/',
    'npm run build',
  ])
} finally {
  await run_command({
    command: `git -C "${slicedWorkspace}/../.." worktree remove --force "${slicedWorkspace}" 2>/dev/null || rm -rf "${slicedWorkspace}"`,
  })
  console.log(`[sliced-workspace] cleaned up ${slicedWorkspace}`)
}
