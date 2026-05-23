/** biome-ignore-all lint/suspicious/noBitwiseOperators: noise */
/* oxlint-disable unicorn/number-literal-case */
/* eslint-disable no-bitwise */
import type { MachineState, RegisterNumber } from '@/features/mips/types'
import { createInitialState, executeStep, readRegister, writeRegister } from '@/features/mips'
import { decodeInstruction } from '@/features/mips/decode'

interface Breakpoint {
  kind: 'mem' | 'pc' | 'reg' | 'signal'
  target: number
}
interface ProgramState {
  halted: boolean
  history: MachineState[]
  output: string[]
  speed: number
  trace: TraceEntry[]
  words: number[]
}
interface SyscallEvent {
  kind: 'exit' | 'printint' | 'printstr' | 'readint' | 'readstr'
  value: number
}
interface TraceEntry {
  index: number
  name: string
  pc: number
  word: number
}
interface Watchpoint {
  kind: 'memwrite' | 'regwrite'
  target: number
}
const SYSCALL_WORD = 0xc
interface Seed {
  memory?: Record<number, number>
  pc?: number
  registers?: Record<number, number>
}
const createProgram = (words: readonly number[], speed = 1, seed?: Seed): ProgramState => {
  let init = createInitialState()
  if (seed?.registers !== undefined)
    for (const [k, v] of Object.entries(seed.registers)) init = writeRegister(init, Number(k) as RegisterNumber, v)
  if (seed?.memory !== undefined) init = { ...init, dataMemory: { ...init.dataMemory, ...seed.memory } }
  if (seed?.pc !== undefined) init = { ...init, pc: seed.pc }
  return { halted: false, history: [init], output: [], speed, trace: [], words: [...words] }
}
const current = (p: ProgramState): MachineState => p.history.at(-1) ?? createInitialState()
const pcIndex = (p: ProgramState): number => current(p).pc >>> 2
const runSyscall = (state: MachineState): SyscallEvent => {
  const service = readRegister(state, 2)
  const arg = readRegister(state, 4)
  if (service === 1) return { kind: 'printint', value: arg }
  if (service === 4) return { kind: 'printstr', value: arg }
  if (service === 5) return { kind: 'readint', value: 0 }
  if (service === 8) return { kind: 'readstr', value: 0 }
  return { kind: 'exit', value: arg }
}
const stepForward = (p: ProgramState): ProgramState => {
  if (p.halted) return p
  const state = current(p)
  const idx = state.pc >>> 2
  const word = p.words[idx]
  if (word === undefined) return { ...p, halted: true }
  if (word === SYSCALL_WORD) {
    const ev = runSyscall(state)
    const output = ev.kind === 'printint' || ev.kind === 'printstr' ? [...p.output, String(ev.value)] : p.output
    const halted = ev.kind === 'exit'
    const advanced: MachineState = { ...state, pc: state.pc + 4 }
    return { ...p, halted, history: [...p.history, advanced], output }
  }
  const decoded = decodeInstruction(word)
  const step = executeStep(state, word, decoded)
  const trace: TraceEntry = { index: p.trace.length, name: decoded.name, pc: state.pc, word }
  return { ...p, history: [...p.history, { ...step.nextState, pc: step.nextPc }], trace: [...p.trace, trace] }
}
const stepBack = (p: ProgramState): ProgramState => {
  if (p.history.length <= 1) return p
  return { ...p, halted: false, history: p.history.slice(0, -1), trace: p.trace.slice(0, -1) }
}
const reset = (p: ProgramState): ProgramState => createProgram(p.words, p.speed)
const breakpointHit = (state: MachineState, bps: readonly Breakpoint[]): boolean => {
  for (const bp of bps) {
    if (bp.kind === 'pc' && state.pc >>> 2 === bp.target) return true
    if (bp.kind === 'reg' && readRegister(state, bp.target as RegisterNumber) !== 0) return true
    if (bp.kind === 'mem' && (state.dataMemory[bp.target] ?? 0) !== 0) return true
  }
  return false
}
const watchpointHit = (before: MachineState, after: MachineState, wps: readonly Watchpoint[]): boolean => {
  for (const wp of wps) {
    if (
      wp.kind === 'regwrite' &&
      before.registers[wp.target as RegisterNumber] !== after.registers[wp.target as RegisterNumber]
    )
      return true
    if (wp.kind === 'memwrite' && (before.dataMemory[wp.target] ?? 0) !== (after.dataMemory[wp.target] ?? 0)) return true
  }
  return false
}
const runToCursor = (p: ProgramState, targetIndex: number, maxSteps = 10_000): ProgramState => {
  let s = p
  for (let i = 0; i < maxSteps; i += 1) {
    if (s.halted || pcIndex(s) === targetIndex) return s
    s = stepForward(s)
  }
  return s
}
const runToBreakpoint = (
  p: ProgramState,
  spec: { breakpoints?: readonly Breakpoint[]; watchpoints?: readonly Watchpoint[] } = {},
  maxSteps = 10_000
): ProgramState => {
  const bps = spec.breakpoints ?? []
  const wps = spec.watchpoints ?? []
  let s = p
  for (let i = 0; i < maxSteps; i += 1) {
    if (s.halted) return s
    const before = current(s)
    const next = stepForward(s)
    if (next === s) return s
    if (breakpointHit(current(next), bps)) return next
    if (watchpointHit(before, current(next), wps)) return next
    s = next
  }
  return s
}
export { createProgram, current, pcIndex, reset, runSyscall, runToBreakpoint, runToCursor, stepBack, stepForward }
export type { Breakpoint, ProgramState, SyscallEvent, TraceEntry, Watchpoint }
