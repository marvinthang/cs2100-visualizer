/** biome-ignore-all lint/suspicious/noBitwiseOperators: noise */
/* oxlint-disable unicorn/number-literal-case */
/* eslint-disable no-bitwise */
import { insertField } from '@sim/bits'
import type { Instruction, RegisterNumber } from './types'

const OPCODE = {
  R: 0,
  addi: 0x08,
  andi: 0x0c,
  beq: 0x04,
  bne: 0x05,
  j: 0x02,
  jal: 0x03,
  lui: 0x0f,
  lw: 0x23,
  ori: 0x0d,
  sw: 0x2b,
  xori: 0x0e
} as const
const FUNCT = {
  add: 0x20,
  and: 0x24,
  jr: 0x08,
  nor: 0x27,
  or: 0x25,
  sll: 0x00,
  slt: 0x2a,
  sltu: 0x2b,
  sra: 0x03,
  srl: 0x02,
  sub: 0x22,
  xor: 0x26
} as const
const reg = (n: RegisterNumber): number => n & 0x1f
const encode16 = (imm: number): number => imm & 0xff_ff
const encodeInstruction = (instruction: Instruction): number => {
  let word = 0
  if (instruction.type === 'R') {
    word = insertField(word, 31, 26, OPCODE.R)
    word = insertField(word, 25, 21, reg(instruction.rs))
    word = insertField(word, 20, 16, reg(instruction.rt))
    word = insertField(word, 15, 11, reg(instruction.rd))
    word = insertField(word, 10, 6, instruction.shamt & 0x1f)
    word = insertField(word, 5, 0, instruction.funct & 0x3f)
    return word
  }
  if (instruction.type === 'I') {
    word = insertField(word, 31, 26, instruction.opcode & 0x3f)
    word = insertField(word, 25, 21, reg(instruction.rs))
    word = insertField(word, 20, 16, reg(instruction.rt))
    word = insertField(word, 15, 0, encode16(instruction.imm))
    return word
  }
  word = insertField(word, 31, 26, instruction.opcode & 0x3f)
  word = insertField(word, 25, 0, instruction.target & 0x3_ff_ff_ff)
  return word
}
export { encodeInstruction, FUNCT, OPCODE }
