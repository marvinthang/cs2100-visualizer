import { describe, expect, test } from 'bun:test'
import { decodeInstruction } from '@/features/mips/decode'
import { assemble, parseRegister } from './asm-grammar'

describe('asm-grammar parseRegister', () => {
  test('numeric + alias', () => {
    expect(parseRegister('$0')).toBe(0)
    expect(parseRegister('$t0')).toBe(8)
    expect(parseRegister('$ra')).toBe(31)
    expect(parseRegister('$sp')).toBe(29)
    expect(parseRegister('nope')).toBeUndefined()
  })
})
describe('asm-grammar assemble', () => {
  test('R-type add round-trips through decode', () => {
    const r = assemble('add $t0, $t1, $t2')
    expect(r.diagnostics).toHaveLength(0)
    expect(r.instructions).toHaveLength(1)
    const d = decodeInstruction(r.words[0] ?? 0)
    expect(d.type).toBe('R')
    expect(d.name).toBe('add')
  })
  test('labels + beq compute relative offset, no undefined-label error', () => {
    const r = assemble(['loop:', 'addi $t0, $t0, 1', 'beq $t0, $zero, loop'].join('\n'))
    expect(r.symbols.loop).toBe(0)
    expect(r.diagnostics.filter(x => x.code === 'ASM_UNDEFINED_LABEL')).toHaveLength(0)
    expect(r.instructions).toHaveLength(2)
  })
  test('pseudo nop + move + li expand', () => {
    const r = assemble(['nop', 'move $t0, $t1', 'li $t2, 5'].join('\n'))
    expect(r.diagnostics).toHaveLength(0)
    expect(r.instructions).toHaveLength(3)
  })
  test('li with 32-bit constant expands to lui+ori', () => {
    const r = assemble('li $t0, 0x12345678')
    expect(r.instructions).toHaveLength(2)
    expect(r.instructions[0]?.name).toBe('lui')
    expect(r.instructions[1]?.name).toBe('ori')
  })
  test('lw memory syntax off(base)', () => {
    const r = assemble('lw $t0, 4($sp)')
    expect(r.diagnostics).toHaveLength(0)
    expect(r.instructions[0]?.type).toBe('I')
  })
  test('typed diagnostics: undefined label + duplicate label + unsupported', () => {
    const r = assemble(['j missing', 'a:', 'a:', 'frobnicate $t0'].join('\n'))
    const codes = new Set(r.diagnostics.map(x => x.code))
    expect(codes.has('ASM_UNDEFINED_LABEL')).toBe(true)
    expect(codes.has('ASM_DUPLICATE_LABEL')).toBe(true)
    expect(codes.has('ISA_UNSUPPORTED')).toBe(true)
  })
  test('immediate out of range flagged', () => {
    const r = assemble('addi $t0, $t1, 999999')
    expect(r.diagnostics.some(x => x.code === 'ASM_IMMEDIATE_RANGE')).toBe(true)
  })
})
