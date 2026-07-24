import { run_command, runAgentStep, checkpoint } from '@sheepdog/sandbox'

const WORKTREE = '../pseudo2-remove-hovercontent-prop'
const BRANCH = 'tooltip/remove-hovercontent-prop'

await checkpoint('create-worktree')
await run_command({ command: `git worktree add -b ${BRANCH} ${WORKTREE} HEAD` })
await run_command({ command: 'npm install', cwd: WORKTREE })

await checkpoint('make-changes')
const { completed } = await runAgentStep({
  agent: 'opencode',
  on_verification_fail: 'fix',
  checkpoint_on_complete: true,
  plan: `You are working in ${WORKTREE} (cwd is already set). The repository is at ${WORKTREE}.

## Goal
Remove the \`HoverContent\` prop from the tooltip chain. Instead:
- Most tooltip data (including title and body) is fetched via the existing \`getNodeDetail\` IPC call
- A minimal inline fallback (\`{ title: string; body?: string }\`) is passed directly for purely static tooltips (React hooks, keywords) that have no AST \`refPos\`

## Files to touch (in order)

### 1. \`src/main/translationService/renderable/types.ts\`
- Add optional \`title\`, \`body\`, \`metadata\` fields to \`TooltipData\`/QueryAnswer
- Remove \`hover?: HoverContent\` from \`DisplaySpan\`
- Replace with \`hasHover?: boolean\` (already exists)
- Keep \`HoverContent\` interface (used server-side) or optionally remove it

### 2. \`src/main/tooltip/tooltipService.ts\`
- Import and use \`getReactHookTooltip\`, \`getKeywordTooltip\`, \`buildHover\` from the hover module
- Enrich \`getNodeDetail\` to accept optional \`{ filePath, query: { refPos?, identifier? } }\`
- When \`identifier\` is provided, look up static content (React hooks, keywords) and return it as \`{ title, body }\`
- When \`refPos\` is provided, also produce the \`title\` for the node (e.g., the node name/description that phrasing used to build as hover title)
- Return \`{ title?, body?, metadata?, sections }\`

### 3. \`src/main/tooltip/tooltipController.ts\`
- Update the IPC handler arg type to match the enriched query (add optional \`identifier\`)

### 4. \`src/main/translationService/renderable/phrasing.ts\`
- Remove all \`buildHover()\`, \`getReactHookTooltip()\`, \`getKeywordTooltip()\` calls
- Remove \`hoverMap\` parameter from \`ts()\` function
- \`DisplaySpan\` objects no longer carry \`hover\` field — just \`refPos\` and \`hasHover\`
- For \`call-function\` phrasing: instead of passing hoverMap with react hook tooltip, just pass the function name as an identifier (or keep refPos)
- For JSX elements: instead of \`buildHover(name, tagDescription)\`, just keep refPos/hasHover
- For className/href/src attributes: remove buildHover calls

### 5. \`src/main/translationService/renderable/hover.ts\`
- Keep \`formatMetadata\` (still used by ToolTip to render IPC response)
- Move \`getReactHookTooltip\`, \`getKeywordTooltip\`, \`buildHover\` — actually they should stay here and be imported by tooltipService.ts

### 6. \`src/shared/api.ts\`
- Update \`ApiInvoke['getNodeDetail']\` arg type to add optional \`identifier?: string\` alongside the existing \`query\`

### 7. \`src/App/components/nodes/StyledSpan.tsx\`
- Remove \`hover?: HoverContent\` prop
- Add \`tooltipFallback?: { title: string; body?: string }\` prop
- \`hasTooltip = !!(tooltipFallback || refPos !== undefined)\`
- In \`handleEnter\` and \`useEffect\`, pass \`{ trigger, refPos, filePath, fallbackTitle: tooltipFallback?.title, fallbackBody: tooltipFallback?.body }\` instead of \`{ hover, ... }\`
- Remove \`import type { HoverContent }\`

### 8. \`src/App/components/hover/useHover.ts\`
- Replace \`hover: HoverContent | null\` in \`HoverState\` with:
  \`\`\`ts
  refPos?: number
  filePath?: string
  fallbackTitle?: string
  fallbackBody?: string
  \`\`\`
- Keep \`trigger: HTMLElement | null\`
- Update \`EMPTY_HOVER\` accordingly (remove hover field, add the new optional fields)
- Remove \`import type { HoverContent }\`

### 9. \`src/App/components/hover/HoverPopover.tsx\`
- Pass new fields to ToolTip instead of \`hover\`:
  \`\`\`tsx
  <ToolTip refPos={hovered.refPos} filePath={hovered.filePath} fallbackTitle={hovered.fallbackTitle} fallbackBody={hovered.fallbackBody} />
  \`\`\`

### 10. \`src/App/components/hover/ToolTip.tsx\`
- Change Props to:
  \`\`\`tsx
  interface Props {
    refPos?: number
    filePath?: string
    fallbackTitle?: string
    fallbackBody?: string
  }
  \`\`\`
- Remove \`hover: HoverContent\` prop
- When \`refPos\` is present: IPC-fetch getNodeDetail, use \`answer.title\` as heading, render \`answer.sections\` via TooltipContent
- When only \`fallbackTitle\`/ \`fallbackBody\`: render those directly, no IPC call
- Remove the old dual-mode logic that checks \`hover.title\`, \`hover.body\`, \`hover.metadata\`
- Keep \`formatMetadata\` import for rendering IPC-returned metadata
- Remove \`import type { HoverContent }\`

## Verification
After all changes, run:
1. \`npx tsc --noEmit\` — must pass with zero errors
2. \`npx oxlint\` — must pass
3. \`npx vitest run --project unit\` — must pass

Fix any issues until all pass.`
})

// If the agent step didn't complete, skip verify/commit
if (!completed) {
  process.exit(1)
}

await checkpoint('verify')
await run_command({ command: 'npx tsc --noEmit', cwd: WORKTREE })
await run_command({ command: 'npx oxlint', cwd: WORKTREE })
await run_command({ command: 'npx vitest run --project unit', cwd: WORKTREE })

await checkpoint('push-branch')
await run_command({ command: `git add -A`, cwd: WORKTREE })
await run_command({ command: `git commit -m 'tooltip: remove HoverContent prop, fetch all content from IPC'`, cwd: WORKTREE })
await run_command({ command: `git push origin ${BRANCH}`, cwd: WORKTREE })
