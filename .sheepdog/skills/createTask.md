# Creating a SheepDog Task

SheepDog is a multi-phase task orchestrator. A task is a TypeScript script (`main.ts`) under `.sheepdog/<task-name>/` that uses the sandbox API.

## Step-by-Step

### 1. Create the task directory

```
.sheepdog/<task-name>/
└── main.ts
```

### 2. Write `main.ts`

Import from `@sheepdog/sandbox`:

```ts
import { run_command, run_verification, checkpoint } from '@sheepdog/sandbox'

await checkpoint('build')
await run_command({ command: 'npm run build' })

await checkpoint('test')
await run_command({ command: 'npx vitest run' })
```

### Available API
Check the exports in ../sandbox.d.ts for available API.

### 3. Run

```bash
sheepdog run <task-name>
```

Resume automatically from the last checkpoint:

```bash
sheepdog resume <task-name>
```

## Best Practices

- Checkpoint after each logical step for granular resume
- If a task can be broken into multiple agent steps, split it into multiple steps
- Generally, prefer creating markdown files for agent instructions instead of passing in the instructions directly
- Use `run_command` for test gates between phases
- Use `npx vitest run` (not `npx vitest`) — bare vitest starts watch mode and never exits
