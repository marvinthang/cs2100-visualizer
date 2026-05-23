/** biome-ignore-all lint/suspicious/noBitwiseOperators: noise */
/* oxlint-disable unicorn/number-literal-case */
/* eslint-disable @typescript-eslint/prefer-destructuring, @typescript-eslint/switch-exhaustiveness-check, no-bitwise */
import { addU32, signExtend, subU32 } from '@sim/bits'
import type { ControlSignals, ExecutionStep, Instruction, MachineState, RegisterNumber } from './types'

const ZERO_CONTROL: ControlSignals = {
  ALUOp: 0,
  ALUSrc: 0,
  Branch: 0,
  BranchNE: 0,
  MemRead: 0,
  MemToReg: 0,
  MemWrite: 0,
  RegDst: 0,
  RegWrite: 0
}
const REG_COUNT = 32
const u32 = (n: number): number => (n + 0x1_00_00_00_00) % 0x1_00_00_00_00
const zeroRegisters = (): Record<RegisterNumber, number> => {
  const r = {} as Record<RegisterNumber, number>
  for (let i = 0; i < REG_COUNT; i += 1) r[i as RegisterNumber] = 0
  return r
}
const createInitialState = (): MachineState => ({ dataMemory: {}, pc: 0, registers: zeroRegisters() })
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const readRegister = (state: MachineState, reg: RegisterNumber): number => state.registers[reg] ?? 0
const writeRegister = (state: MachineState, reg: RegisterNumber, value: number): MachineState => {
  if (reg === 0) return state
  return { ...state, registers: { ...state.registers, [reg]: value } }
}
const readMemory = (state: MachineState, address: number): number => state.dataMemory[address] ?? 0
const writeMemory = (state: MachineState, address: number, value: number): MachineState => ({
  ...state,
  dataMemory: { ...state.dataMemory, [address]: value }
})
const signedNumber = (n: number): number => signExtend(n, 32)
const controlFor = (instruction: Instruction): ControlSignals => {
  if (instruction.type === 'R') return { ...ZERO_CONTROL, ALUOp: 2, RegDst: 1, RegWrite: 1 }
  switch (instruction.name) {
    case 'addi':
    case 'andi':
    case 'lui':
    case 'ori':
    case 'xori':
      return { ...ZERO_CONTROL, ALUSrc: 1, RegWrite: 1 }
    case 'beq':
      return { ...ZERO_CONTROL, ALUOp: 1, Branch: 1 }
    case 'bne':
      return { ...ZERO_CONTROL, ALUOp: 1, BranchNE: 1 }
    case 'j':
    case 'jal':
      return { ...ZERO_CONTROL, RegWrite: instruction.name === 'jal' ? 1 : 0 }
    case 'lw':
      return { ...ZERO_CONTROL, ALUSrc: 1, MemRead: 1, MemToReg: 1, RegWrite: 1 }
    case 'sw':
      return { ...ZERO_CONTROL, ALUSrc: 1, MemWrite: 1 }
    default:
      return ZERO_CONTROL
  }
}
const executeR = (state: MachineState, ins: Instruction & { type: 'R' }): MachineState => {
  const rs = readRegister(state, ins.rs)
  const rt = readRegister(state, ins.rt)
  const rsSigned = signedNumber(rs)
  const rtSigned = signedNumber(rt)
  let result: number
  switch (ins.name) {
    case 'add':
      result = addU32(rs, rt)
      break
    case 'and':
      result = u32(rs & rt)
      break
    case 'jr':
      return { ...state, pc: rs }
    case 'nor':
      result = u32(~(rs | rt))
      break
    case 'or':
      result = u32(rs | rt)
      break
    case 'sll':
      result = u32(rt << ins.shamt)
      break
    case 'slt':
      result = rsSigned < rtSigned ? 1 : 0
      break
    case 'sltu':
      result = u32(rs) < u32(rt) ? 1 : 0
      break
    case 'sra':
      result = u32(rtSigned >> ins.shamt)
      break
    case 'srl':
      result = rt >>> ins.shamt
      break
    case 'sub':
      result = subU32(rs, rt)
      break
    case 'xor':
      result = u32(rs ^ rt)
      break
    default:
      return state
  }
  return writeRegister(state, ins.rd, result)
}
const executeI = (
  state: MachineState,
  ins: Instruction & { type: 'I' }
): { branchTaken: boolean; nextState: MachineState } => {
  const rs = readRegister(state, ins.rs)
  const rt = readRegister(state, ins.rt)
  const immSE = signExtend(ins.imm, 16)
  switch (ins.name) {
    case 'addi':
      return { branchTaken: false, nextState: writeRegister(state, ins.rt, addU32(rs, u32(immSE))) }
    case 'andi':
      return { branchTaken: false, nextState: writeRegister(state, ins.rt, u32(rs & ins.imm)) }
    case 'beq':
      return { branchTaken: rs === rt, nextState: state }
    case 'bne':
      return { branchTaken: rs !== rt, nextState: state }
    case 'lui':
      return { branchTaken: false, nextState: writeRegister(state, ins.rt, u32(ins.imm << 16)) }
    case 'lw': {
      const addr = addU32(rs, u32(immSE))
      return { branchTaken: false, nextState: writeRegister(state, ins.rt, readMemory(state, addr)) }
    }
    case 'ori': {
      const ored = u32(rs + ins.imm - (rs & ins.imm))
      return { branchTaken: false, nextState: writeRegister(state, ins.rt, ored) }
    }
    case 'sw': {
      const addr = addU32(rs, u32(immSE))
      return { branchTaken: false, nextState: writeMemory(state, addr, rt) }
    }
    case 'xori':
      return { branchTaken: false, nextState: writeRegister(state, ins.rt, u32(rs ^ ins.imm)) }
    default:
      return { branchTaken: false, nextState: state }
  }
}
const executeStep = (state: MachineState, word: number, instruction: Instruction): ExecutionStep => {
  const control = controlFor(instruction)
  const pcAfter = addU32(state.pc, 4)
  let nextState: MachineState = state
  let nextPc: number = pcAfter
  if (instruction.type === 'R') {
    nextState = executeR(state, instruction)
    if (instruction.name === 'jr') nextPc = nextState.pc
  } else if (instruction.type === 'I') {
    const out = executeI(state, instruction)
    nextState = out.nextState
    if (out.branchTaken) nextPc = addU32(pcAfter, u32(signExtend(instruction.imm, 16) << 2))
  } else {
    const targetAddr = u32((pcAfter & 0xf0_00_00_00) | (instruction.target << 2))
    if (instruction.name === 'jal') nextState = writeRegister(state, 31, pcAfter)
    nextPc = targetAddr
  }
  nextState = { ...nextState, pc: nextPc }
  return { control, instruction, nextPc, nextState, pcBefore: state.pc, stateBefore: state, word }
}
export { controlFor, createInitialState, executeStep, readMemory, readRegister, writeMemory, writeRegister }
