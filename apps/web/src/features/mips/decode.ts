import { extractField } from '@sim/bits'
import type { Instruction, InstructionName, RegisterNumber } from './types'
import { FUNCT, OPCODE } from './encode'

const R_NAME_BY_FUNCT: Record<number, InstructionName> = {
  [FUNCT.add]: 'add',
  [FUNCT.and]: 'and',
  [FUNCT.jr]: 'jr',
  [FUNCT.nor]: 'nor',
  [FUNCT.or]: 'or',
  [FUNCT.sll]: 'sll',
  [FUNCT.slt]: 'slt',
  [FUNCT.sltu]: 'sltu',
  [FUNCT.sra]: 'sra',
  [FUNCT.srl]: 'srl',
  [FUNCT.sub]: 'sub',
  [FUNCT.xor]: 'xor'
}
const I_J_NAME_BY_OPCODE: Record<number, InstructionName> = {
  [OPCODE.addi]: 'addi',
  [OPCODE.andi]: 'andi',
  [OPCODE.beq]: 'beq',
  [OPCODE.bne]: 'bne',
  [OPCODE.j]: 'j',
  [OPCODE.jal]: 'jal',
  [OPCODE.lui]: 'lui',
  [OPCODE.lw]: 'lw',
  [OPCODE.ori]: 'ori',
  [OPCODE.sw]: 'sw',
  [OPCODE.xori]: 'xori'
}
const J_OPCODES = new Set<number>([OPCODE.j, OPCODE.jal])
const decodeInstruction = (word: number): Instruction => {
  const opcode = extractField(word, 31, 26)
  if (opcode === OPCODE.R) {
    const rs = extractField(word, 25, 21) as RegisterNumber
    const rt = extractField(word, 20, 16) as RegisterNumber
    const rd = extractField(word, 15, 11) as RegisterNumber
    const shamt = extractField(word, 10, 6)
    const funct = extractField(word, 5, 0)
    const name = R_NAME_BY_FUNCT[funct]
    if (name === undefined)
      throw new Error(`decode: unknown R-type funct 0x${funct.toString(16)} for word 0x${word.toString(16)}`)
    return { funct, name, rd, rs, rt, shamt, type: 'R' }
  }
  if (J_OPCODES.has(opcode)) {
    const target = extractField(word, 25, 0)
    const name = I_J_NAME_BY_OPCODE[opcode]
    if (name === undefined) throw new Error(`decode: unknown J-type opcode 0x${opcode.toString(16)}`)
    return { name, opcode, target, type: 'J' }
  }
  const rs = extractField(word, 25, 21) as RegisterNumber
  const rt = extractField(word, 20, 16) as RegisterNumber
  const imm = extractField(word, 15, 0)
  const name = I_J_NAME_BY_OPCODE[opcode]
  if (name === undefined) throw new Error(`decode: unknown I-type opcode 0x${opcode.toString(16)}`)
  return { imm, name, opcode, rs, rt, type: 'I' }
}
export { decodeInstruction }
