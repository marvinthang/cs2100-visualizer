/** biome-ignore-all lint/suspicious/noMisplacedAssertion: noise */
import { describe, expect, test } from 'bun:test'
import type { Instruction, MachineState, RegisterNumber } from './types'
import {
  controlFor,
  createInitialState,
  decodeInstruction,
  encodeInstruction,
  executeStep,
  readRegister,
  writeMemory,
  writeRegister
} from './index'

const buildR = (name: Instruction & { type: 'R' }): Instruction => name
const seedState = (overrides: (s: MachineState) => MachineState = s => s): MachineState => overrides(createInitialState())
const step = (state: MachineState, ins: Instruction): ReturnType<typeof executeStep> => {
  const word = encodeInstruction(ins)
  const decoded = decodeInstruction(word)
  expect(decoded.name).toBe(ins.name)
  return executeStep(state, word, decoded)
}
describe('golden: add', () => {
  test('add $3, $1, $2 — 5 + 7 = 12', () => {
    const state = seedState(s => writeRegister(writeRegister(s, 1, 5), 2, 7))
    const ins = buildR({
      funct: 0x20,
      name: 'add',
      rd: 3 as RegisterNumber,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      shamt: 0,
      type: 'R'
    })
    const out = step(state, ins)
    expect(readRegister(out.nextState, 3)).toBe(12)
    expect(out.nextPc).toBe(4)
    expect(out.control.RegWrite).toBe(1)
  })
})
describe('golden: addi', () => {
  test('addi $1, $0, 42', () => {
    const state = createInitialState()
    const ins: Instruction = {
      imm: 42,
      name: 'addi',
      opcode: 0x08,
      rs: 0 as RegisterNumber,
      rt: 1 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(readRegister(out.nextState, 1)).toBe(42)
  })
  test('addi sign-extends negative immediate', () => {
    const state = writeRegister(createInitialState(), 1, 100)
    const ins: Instruction = {
      imm: 0xff_f0,
      name: 'addi',
      opcode: 0x08,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(readRegister(out.nextState, 2)).toBe(100 - 16)
  })
})
describe('golden: and', () => {
  test('and $3, $1, $2', () => {
    const state = seedState(s => writeRegister(writeRegister(s, 1, 0xff_00), 2, 0xf0_f0))
    const ins = buildR({
      funct: 0x24,
      name: 'and',
      rd: 3 as RegisterNumber,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      shamt: 0,
      type: 'R'
    })
    const out = step(state, ins)
    expect(readRegister(out.nextState, 3)).toBe(0xf0_00)
  })
})
describe('golden: beq', () => {
  test('beq taken jumps forward', () => {
    const state: MachineState = { ...createInitialState(), pc: 0x1_00 }
    const ins: Instruction = {
      imm: 4,
      name: 'beq',
      opcode: 0x04,
      rs: 0 as RegisterNumber,
      rt: 0 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(out.nextPc).toBe(0x1_04 + 16)
  })
  test('beq not taken falls through', () => {
    const state = writeRegister({ ...createInitialState(), pc: 0x1_00 }, 1, 1)
    const ins: Instruction = {
      imm: 4,
      name: 'beq',
      opcode: 0x04,
      rs: 0 as RegisterNumber,
      rt: 1 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(out.nextPc).toBe(0x1_04)
  })
})
describe('golden: bne', () => {
  test('bne taken when different', () => {
    const state = writeRegister({ ...createInitialState(), pc: 0x2_00 }, 1, 5)
    const ins: Instruction = {
      imm: 2,
      name: 'bne',
      opcode: 0x05,
      rs: 0 as RegisterNumber,
      rt: 1 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(out.nextPc).toBe(0x2_04 + 8)
  })
})
describe('golden: lw', () => {
  test('lw $1, 4($2) reads memory', () => {
    const state = writeMemory(writeRegister(createInitialState(), 2, 0x1_00), 0x1_04, 0xde_ad_be_ef)
    const ins: Instruction = {
      imm: 4,
      name: 'lw',
      opcode: 0x23,
      rs: 2 as RegisterNumber,
      rt: 1 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(readRegister(out.nextState, 1)).toBe(0xde_ad_be_ef)
  })
})
describe('golden: or', () => {
  test('or $3, $1, $2', () => {
    const state = seedState(s => writeRegister(writeRegister(s, 1, 0xff_00), 2, 0x00_ff))
    const ins = buildR({
      funct: 0x25,
      name: 'or',
      rd: 3 as RegisterNumber,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      shamt: 0,
      type: 'R'
    })
    const out = step(state, ins)
    expect(readRegister(out.nextState, 3)).toBe(0xff_ff)
  })
})
describe('golden: slt', () => {
  test('slt $3, $1, $2 when rs < rt', () => {
    const state = seedState(s => writeRegister(writeRegister(s, 1, 5), 2, 10))
    const ins = buildR({
      funct: 0x2a,
      name: 'slt',
      rd: 3 as RegisterNumber,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      shamt: 0,
      type: 'R'
    })
    const out = step(state, ins)
    expect(readRegister(out.nextState, 3)).toBe(1)
  })
  test('slt with negative rs less than positive rt', () => {
    const state = seedState(s => writeRegister(writeRegister(s, 1, 0xff_ff_ff_ff), 2, 1))
    const ins = buildR({
      funct: 0x2a,
      name: 'slt',
      rd: 3 as RegisterNumber,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      shamt: 0,
      type: 'R'
    })
    const out = step(state, ins)
    expect(readRegister(out.nextState, 3)).toBe(1)
  })
})
describe('golden: sub', () => {
  test('sub $3, $1, $2 — 10 - 3 = 7', () => {
    const state = seedState(s => writeRegister(writeRegister(s, 1, 10), 2, 3))
    const ins = buildR({
      funct: 0x22,
      name: 'sub',
      rd: 3 as RegisterNumber,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      shamt: 0,
      type: 'R'
    })
    const out = step(state, ins)
    expect(readRegister(out.nextState, 3)).toBe(7)
  })
})
describe('golden: sw', () => {
  test('sw $1, 8($2) writes memory', () => {
    const state = writeRegister(writeRegister(createInitialState(), 1, 0xca_fe_ba_be), 2, 0x2_00)
    const ins: Instruction = {
      imm: 8,
      name: 'sw',
      opcode: 0x2b,
      rs: 2 as RegisterNumber,
      rt: 1 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(out.nextState.dataMemory[0x2_08]).toBe(0xca_fe_ba_be)
  })
})
describe('encode↔decode round-trip for floor instruction set', () => {
  test.each([
    [
      {
        funct: 0x20,
        name: 'add' as const,
        rd: 3 as RegisterNumber,
        rs: 1 as RegisterNumber,
        rt: 2 as RegisterNumber,
        shamt: 0,
        type: 'R' as const
      }
    ],
    [
      {
        imm: 0x12_34,
        name: 'addi' as const,
        opcode: 0x08,
        rs: 1 as RegisterNumber,
        rt: 2 as RegisterNumber,
        type: 'I' as const
      }
    ],
    [
      {
        funct: 0x24,
        name: 'and' as const,
        rd: 3 as RegisterNumber,
        rs: 1 as RegisterNumber,
        rt: 2 as RegisterNumber,
        shamt: 0,
        type: 'R' as const
      }
    ],
    [
      {
        imm: 0x10,
        name: 'beq' as const,
        opcode: 0x04,
        rs: 1 as RegisterNumber,
        rt: 2 as RegisterNumber,
        type: 'I' as const
      }
    ],
    [
      {
        imm: 0x20,
        name: 'bne' as const,
        opcode: 0x05,
        rs: 1 as RegisterNumber,
        rt: 2 as RegisterNumber,
        type: 'I' as const
      }
    ],
    [
      { imm: 0x4, name: 'lw' as const, opcode: 0x23, rs: 1 as RegisterNumber, rt: 2 as RegisterNumber, type: 'I' as const }
    ],
    [
      {
        funct: 0x2a,
        name: 'slt' as const,
        rd: 3 as RegisterNumber,
        rs: 1 as RegisterNumber,
        rt: 2 as RegisterNumber,
        shamt: 0,
        type: 'R' as const
      }
    ],
    [
      {
        funct: 0x25,
        name: 'or' as const,
        rd: 3 as RegisterNumber,
        rs: 1 as RegisterNumber,
        rt: 2 as RegisterNumber,
        shamt: 0,
        type: 'R' as const
      }
    ],
    [
      { imm: 0x4, name: 'sw' as const, opcode: 0x2b, rs: 1 as RegisterNumber, rt: 2 as RegisterNumber, type: 'I' as const }
    ],
    [
      {
        funct: 0x22,
        name: 'sub' as const,
        rd: 3 as RegisterNumber,
        rs: 1 as RegisterNumber,
        rt: 2 as RegisterNumber,
        shamt: 0,
        type: 'R' as const
      }
    ]
  ])('encode→decode preserves shape: %o', (ins: Instruction) => {
    const word = encodeInstruction(ins)
    const decoded = decodeInstruction(word)
    expect(decoded.name).toBe(ins.name)
    expect(decoded.type).toBe(ins.type)
  })
})
describe('control signals', () => {
  test('R-type sets RegDst + RegWrite + ALUOp=2', () => {
    const ctl = controlFor({
      funct: 0x20,
      name: 'add',
      rd: 3 as RegisterNumber,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      shamt: 0,
      type: 'R'
    })
    expect(ctl.RegDst).toBe(1)
    expect(ctl.RegWrite).toBe(1)
    expect(ctl.ALUOp).toBe(2)
  })
  test('lw sets MemRead+MemToReg+RegWrite+ALUSrc', () => {
    const ctl = controlFor({
      imm: 0,
      name: 'lw',
      opcode: 0x23,
      rs: 0 as RegisterNumber,
      rt: 1 as RegisterNumber,
      type: 'I'
    })
    expect(ctl.MemRead).toBe(1)
    expect(ctl.MemToReg).toBe(1)
    expect(ctl.RegWrite).toBe(1)
    expect(ctl.ALUSrc).toBe(1)
  })
  test('sw sets MemWrite+ALUSrc, no RegWrite', () => {
    const ctl = controlFor({
      imm: 0,
      name: 'sw',
      opcode: 0x2b,
      rs: 0 as RegisterNumber,
      rt: 1 as RegisterNumber,
      type: 'I'
    })
    expect(ctl.MemWrite).toBe(1)
    expect(ctl.ALUSrc).toBe(1)
    expect(ctl.RegWrite).toBe(0)
  })
  test('beq sets Branch + ALUOp=1', () => {
    const ctl = controlFor({
      imm: 0,
      name: 'beq',
      opcode: 0x04,
      rs: 0 as RegisterNumber,
      rt: 0 as RegisterNumber,
      type: 'I'
    })
    expect(ctl.Branch).toBe(1)
    expect(ctl.ALUOp).toBe(1)
  })
})
describe('golden: andi', () => {
  test('andi $2, $1, 0x0f', () => {
    const state = writeRegister(createInitialState(), 1, 0xff)
    const ins: Instruction = {
      imm: 0x0f,
      name: 'andi',
      opcode: 0x0c,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(readRegister(out.nextState, 2)).toBe(0x0f)
  })
})
describe('golden: j', () => {
  test('j 0x100 jumps absolute', () => {
    const state: MachineState = { ...createInitialState(), pc: 0x10 }
    const ins: Instruction = { name: 'j', opcode: 0x02, target: 0x1_00, type: 'J' }
    const out = step(state, ins)
    expect(out.nextPc).toBe(0x4_00)
  })
})
describe('golden: lui', () => {
  test('lui $1, 0xabcd shifts left 16', () => {
    const state = createInitialState()
    const ins: Instruction = {
      imm: 0xab_cd,
      name: 'lui',
      opcode: 0x0f,
      rs: 0 as RegisterNumber,
      rt: 1 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(Math.trunc(readRegister(out.nextState, 1)).toString(16)).toBe('abcd0000')
  })
})
describe('golden: nor', () => {
  test('nor $3, $1, $2', () => {
    const state = writeRegister(writeRegister(createInitialState(), 1, 0), 2, 0)
    const ins = buildR({
      funct: 0x27,
      name: 'nor',
      rd: 3 as RegisterNumber,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      shamt: 0,
      type: 'R'
    })
    const out = step(state, ins)
    expect(Math.trunc(readRegister(out.nextState, 3)).toString(16)).toBe('ffffffff')
  })
})
describe('golden: ori', () => {
  test('ori $2, $1, 0x00f0', () => {
    const state = writeRegister(createInitialState(), 1, 0x0f_00)
    const ins: Instruction = {
      imm: 0x00_f0,
      name: 'ori',
      opcode: 0x0d,
      rs: 1 as RegisterNumber,
      rt: 2 as RegisterNumber,
      type: 'I'
    }
    const out = step(state, ins)
    expect(readRegister(out.nextState, 2)).toBe(0x0f_f0)
  })
})
describe('golden: sll', () => {
  test('sll $3, $1, 4', () => {
    const state = writeRegister(createInitialState(), 1, 0xff)
    const ins = buildR({
      funct: 0x00,
      name: 'sll',
      rd: 3 as RegisterNumber,
      rs: 0 as RegisterNumber,
      rt: 1 as RegisterNumber,
      shamt: 4,
      type: 'R'
    })
    const out = step(state, ins)
    expect(readRegister(out.nextState, 3)).toBe(0xf_f0)
  })
})
describe('golden: srl', () => {
  test('srl $3, $1, 4', () => {
    const state = writeRegister(createInitialState(), 1, 0xff_00)
    const ins = buildR({
      funct: 0x02,
      name: 'srl',
      rd: 3 as RegisterNumber,
      rs: 0 as RegisterNumber,
      rt: 1 as RegisterNumber,
      shamt: 4,
      type: 'R'
    })
    const out = step(state, ins)
    expect(readRegister(out.nextState, 3)).toBe(0x0f_f0)
  })
})
