export { decodeInstruction } from './decode'
export { encodeInstruction, FUNCT, OPCODE } from './encode'
export {
  controlFor,
  createInitialState,
  executeStep,
  readMemory,
  readRegister,
  writeMemory,
  writeRegister
} from './execute'
export type {
  ControlSignals,
  ExecutionStep,
  Instruction,
  InstructionName,
  IType,
  JType,
  MachineState,
  RegisterNumber,
  RType
} from './types'
