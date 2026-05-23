interface ControlSignals {
  ALUOp: 0 | 1 | 2
  ALUSrc: 0 | 1
  Branch: 0 | 1
  BranchNE: 0 | 1
  MemRead: 0 | 1
  MemToReg: 0 | 1
  MemWrite: 0 | 1
  RegDst: 0 | 1
  RegWrite: 0 | 1
}
interface ExecutionStep {
  control: ControlSignals
  instruction: Instruction
  nextPc: number
  nextState: MachineState
  pcBefore: number
  stateBefore: MachineState
  word: number
}
type Instruction = IType | JType | RType
type InstructionName =
  | 'add'
  | 'addi'
  | 'and'
  | 'andi'
  | 'beq'
  | 'bne'
  | 'j'
  | 'jal'
  | 'jr'
  | 'lui'
  | 'lw'
  | 'nor'
  | 'or'
  | 'ori'
  | 'sll'
  | 'slt'
  | 'sltu'
  | 'sra'
  | 'srl'
  | 'sub'
  | 'sw'
  | 'xor'
  | 'xori'
interface IType {
  imm: number
  name: InstructionName
  opcode: number
  rs: RegisterNumber
  rt: RegisterNumber
  type: 'I'
}
interface JType {
  name: InstructionName
  opcode: number
  target: number
  type: 'J'
}
interface MachineState {
  dataMemory: Record<number, number>
  pc: number
  registers: Record<RegisterNumber, number>
}
type RegisterNumber =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
interface RType {
  funct: number
  name: InstructionName
  rd: RegisterNumber
  rs: RegisterNumber
  rt: RegisterNumber
  shamt: number
  type: 'R'
}
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
}
