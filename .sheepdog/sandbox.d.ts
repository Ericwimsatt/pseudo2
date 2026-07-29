// Type declarations for the @sheepdog/sandbox module
// This file is copied into .sheepdog/ to provide editor support

declare module '@sheepdog/sandbox' {
  export interface AgentStepOptions {
    agent: 'opencode' | string
    plan: string
    on_verification_fail?: 'fix' | 'stop' | 'continue'
    checkpoint_on_complete?: boolean
    nudgeInterval?: number
    cwd?: string
  }

  export interface VerificationOptions {
    path: string
  }

  export interface ShellOptions {
    command: string
    cwd?: string
    optional?: boolean
  }

  export interface SeedSpec {
    files?: string[]
    symbols?: string[]
    taskDescription?: string
  }

  export interface SliceOptions {
    seeds: SeedSpec
    testCommand: string
    maxIterations?: number
    budget?: number
    mergeStrategy?: 'merge' | 'rebase'
    targetBranch?: string
  }

  export interface IterationInfo {
    iteration: number
    sliceTokens: number
    filesCount: number
    testsPassed: boolean
    testOutput: string
  }

  export interface TaskSliceResult {
    success: boolean
    iterations: number
    finalWorktreePath: string
    merged: boolean
    conflicts?: string[]
    testHistory: Array<{
      iteration: number
      passed: boolean
      output: string
      sliceTokens: number
      filesCount: number
    }>
  }

  export function run_agent_step(opts: AgentStepOptions): Promise<{ completed: boolean }>
  export function runAgentStep(opts: AgentStepOptions): Promise<{ completed: boolean }>
  export function run_verification(opts: VerificationOptions): Promise<{ success: boolean; output: string }>
  export function run_command(opts: ShellOptions): Promise<{ exitCode: number; stdout: string; stderr: string }>
  export function checkpoint(name: string): Promise<void>
  export function run_function(fn: () => Promise<void>): Promise<void>
  export function run_agent_slice(opts: SliceOptions): Promise<TaskSliceResult>

  export interface CreateSliceWorkspaceOptions {
    name: string
    seeds: {
      files?: string[]
      symbols?: string[]
      ranges?: Array<{ file: string; start: number; end: number }>
      taskDescription?: string
    }
    alwaysInclude?: string[]
    testCommand?: string
    budget?: number
    cwd?: string
    branch?: string
  }

  export function createSliceWorkspace(opts: CreateSliceWorkspaceOptions): Promise<string>
}
