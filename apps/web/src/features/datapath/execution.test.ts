import { describe, expect, test } from 'bun:test'
import type { MachineState } from '@/features/mips/types'
import { assemble } from './asm-grammar'
import { createProgram, current, reset, runSyscall, runToCursor, stepBack, stepForward } from './execution'

const prog = (src: string) => createProgram(assemble(src).words)
describe('execution stepForward / stepBack history', () => {
  test('addi advances pc and is reversible', () => {
    let p = prog(['addi $t0, $zero, 7', 'addi $t1, $zero, 9'].join('\n'))
    p = stepForward(p)
    expect(current(p).pc).toBe(4)
    expect(current(p).registers[8]).toBe(7)
    p = stepForward(p)
    expect(current(p).registers[9]).toBe(9)
    p = stepBack(p)
    expect(current(p).pc).toBe(4)
    expect(current(p).registers[9]).toBe(0)
  })
  test('halts past program end', () => {
    let p = prog('addi $t0, $zero, 1')
    p = stepForward(p)
    p = stepForward(p)
    expect(p.halted).toBe(true)
  })
})
describe('execution runToCursor + reset', () => {
  test('runs until target instruction index', () => {
    let p = prog(['addi $t0, $zero, 1', 'addi $t0, $t0, 1', 'addi $t0, $t0, 1'].join('\n'))
    p = runToCursor(p, 2)
    expect(current(p).pc / 4).toBe(2)
    p = reset(p)
    expect(current(p).pc).toBe(0)
    expect(p.trace).toHaveLength(0)
  })
})
describe('execution syscalls', () => {
  const withV0A0 = (v0: number, a0: number): MachineState => ({
    dataMemory: {},
    pc: 0,
    registers: Object.assign(Object.fromEntries(Array.from({ length: 32 }, (_, i) => [i, 0])), {
      2: v0,
      4: a0
    }) as MachineState['registers']
  })
  test('service 1 = print int, 5 = read int, 10/other = exit', () => {
    expect(runSyscall(withV0A0(1, 42))).toEqual({ kind: 'printint', value: 42 })
    expect(runSyscall(withV0A0(4, 1000))).toEqual({ kind: 'printstr', value: 1000 })
    expect(runSyscall(withV0A0(5, 0))).toEqual({ kind: 'readint', value: 0 })
    expect(runSyscall(withV0A0(10, 0)).kind).toBe('exit')
  })
})
