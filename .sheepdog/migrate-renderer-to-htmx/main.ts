import { checkpoint, run_command, runAgentStep } from '@sheepdog/sandbox'

const taskDir = '.sheepdog/migrate-renderer-to-htmx'
const projectRoot = '../..'

async function verify(command: string, timeout = 300_000): Promise<void> {
  const result = await run_command({ command, cwd: projectRoot, timeout })
  if (result.exitCode !== 0) {
    console.error(result.stdout)
    console.error(result.stderr)
    process.exit(result.exitCode)
  }
}

async function runPhase(name: string, planFile: string): Promise<void> {
  await checkpoint(name)
  const { completed } = await runAgentStep({
    agent: 'opencode',
    on_verification_fail: 'fix',
    checkpoint_on_complete: true,
    nudgeInterval: 300,
    plan: `Read ${taskDir}/overview.md and ${taskDir}/${planFile}. Implement that phase completely in the current repository.

Build on work from earlier phases. Inspect the current worktree before editing, preserve unrelated changes, do not commit or push, and fix all verification failures caused by the migration. When the phase and its verification are complete, call sheepdog_done.`,
  })

  if (!completed) process.exit(1)
}

await runPhase('phase-1-html-renderer', 'phase-1-html-renderer.md')
await verify('npm run test:typecheck')
await verify('npm run test:lint')
await verify('npx vitest run')

await runPhase('phase-2-ipc-observability', 'phase-2-ipc-observability.md')
await verify('npm run test:typecheck')
await verify('npm run test:lint')
await verify('npx vitest run')
await verify('npx vitest run --config vitest.integration.config.ts')

await runPhase('phase-3-shell-navigation', 'phase-3-shell-navigation.md')
await verify('npm run test:typecheck')
await verify('npm run test:lint')
await verify('npx vitest run --config vitest.integration.config.ts')

await runPhase('phase-4-file-interactions', 'phase-4-file-interactions.md')
await verify('npm run test:typecheck')
await verify('npm run test:lint')
await verify('npx vitest run')
await verify('npx vitest run --config vitest.integration.config.ts')
await verify('npx playwright test test/e2e/navigation.spec.ts test/e2e/sidebar.spec.ts', 600_000)

await runPhase('phase-5-hover', 'phase-5-hover.md')
await verify('npm run test:typecheck')
await verify('npm run test:lint')
await verify('npx playwright test test/e2e/hover.spec.ts test/e2e/enrichment.spec.ts test/e2e/tooltips.spec.ts', 600_000)

await runPhase('phase-6-react-removal', 'phase-6-react-removal.md')
await verify('npm run test:typecheck')
await verify('npm run test:lint')
await verify('npx vitest run')
await verify('npx vitest run --config vitest.integration.config.ts')
await verify('npm run test:e2e', 900_000)

await runPhase('phase-7-production-review', 'phase-7-production-review.md')
await verify('npm run build')
await verify('npm run test:typecheck')
await verify('npm run test:lint')
await verify('npx vitest run')
await verify('npx vitest run --config vitest.integration.config.ts')
await verify('npm run test:e2e', 900_000)
