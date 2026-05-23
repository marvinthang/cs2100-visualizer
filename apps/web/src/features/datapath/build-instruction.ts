/** biome-ignore-all lint/suspicious/noBitwiseOperators: noise */
/* oxlint-disable unicorn/number-literal-case */
/* eslint-disable no-bitwise */
import type { Instruction, InstructionName, RegisterNumber } from '@/features/mips/types'
import { FUNCT, OPCODE } from '@/features/mips/encode'

type Field = 'imm' | 'rd' | 'rs' | 'rt' | 'shamt' | 'target'
interface Operands {
  imm: number
  rd: RegisterNumber
  rs: RegisterNumber
  rt: RegisterNumber
  shamt: number
  target: number
}
const SHIFT = new Set(['sll', 'sra', 'srl'])
const formatOf = (name: string): { fields: Field[]; kind: 'I' | 'J' | 'R' } => {
  if (name === 'j' || name === 'jal') return { fields: ['target'], kind: 'J' }
  if (SHIFT.has(name)) return { fields: ['rd', 'rt', 'shamt'], kind: 'R' }
  if (name in FUNCT) return { fields: ['rd', 'rs', 'rt'], kind: 'R' }
  if (name === 'lui') return { fields: ['rt', 'imm'], kind: 'I' }
  if (name === 'lw' || name === 'sw') return { fields: ['rt', 'rs', 'imm'], kind: 'I' }
  if (name === 'beq' || name === 'bne') return { fields: ['rs', 'rt', 'imm'], kind: 'I' }
  return { fields: ['rt', 'rs', 'imm'], kind: 'I' }
}
const buildInstruction = (name: string, o: Operands): Instruction => {
  const nm = name as InstructionName
  if (name === 'j' || name === 'jal')
    return { name: nm, opcode: (OPCODE as Record<string, number>)[name] ?? 0x02, target: o.target, type: 'J' }
  if (name in FUNCT)
    return {
      funct: (FUNCT as Record<string, number>)[name] ?? 0,
      name: nm,
      rd: o.rd,
      rs: o.rs,
      rt: o.rt,
      shamt: o.shamt,
      type: 'R'
    }
  return { imm: o.imm, name: nm, opcode: (OPCODE as Record<string, number>)[name] ?? 0, rs: o.rs, rt: o.rt, type: 'I' }
}
const decodeFields = (word: number, kind: 'I' | 'J' | 'R'): { label: string; value: number; width: number }[] => {
  const opcode = (word >>> 26) & 0x3f
  if (kind === 'J')
    return [
      { label: 'opcode', value: opcode, width: 6 },
      { label: 'target', value: word & 0x3_ff_ff_ff, width: 26 }
    ]
  if (kind === 'R')
    return [
      { label: 'opcode', value: opcode, width: 6 },
      { label: 'rs', value: (word >>> 21) & 0x1f, width: 5 },
      { label: 'rt', value: (word >>> 16) & 0x1f, width: 5 },
      { label: 'rd', value: (word >>> 11) & 0x1f, width: 5 },
      { label: 'shamt', value: (word >>> 6) & 0x1f, width: 5 },
      { label: 'funct', value: word & 0x3f, width: 6 }
    ]
  return [
    { label: 'opcode', value: opcode, width: 6 },
    { label: 'rs', value: (word >>> 21) & 0x1f, width: 5 },
    { label: 'rt', value: (word >>> 16) & 0x1f, width: 5 },
    { label: 'imm', value: word & 0xff_ff, width: 16 }
  ]
}
export { buildInstruction, decodeFields, formatOf }
export type { Field, Operands }
