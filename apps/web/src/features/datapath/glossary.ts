const GLOSSARY: Record<string, string> = {
  ADD4: 'Outputs the result of two added inputs',
  ALU: 'Arithmetic Logic Unit — computes arithmetic/logic results',
  ALUControl: 'ALU Control — picks the ALU operation from ALUOp + funct',
  ALUOp: 'ALU operation class the main control sends to the ALU control',
  ALUSrc: 'Selects the ALU second operand: register (0) or immediate (1)',
  ALUSrcMux: 'ALUSrc multiplexer — selects the ALU second operand',
  Add4: 'PC + 4 adder — address of the next sequential instruction',
  BeqAnd: 'AND gate — branch taken when Branch and ALU-zero are both 1',
  BneAnd: 'AND gate — branch taken when BranchNE and NOT-zero are both 1',
  Branch: 'beq branch enable',
  BranchAdder: 'Branch adder — PC+4 plus the shifted offset = branch target',
  BranchNE: 'bne branch enable',
  Control: 'Control unit — decodes the opcode into control signals',
  Ctrl: 'Control signals decoded from the instruction',
  DM: 'Data Memory — load/store data',
  EX: 'Execute — the ALU computes the result',
  ID: 'Instruction Decode — read registers and decode the instruction',
  IF: 'Instruction Fetch — read the instruction at the PC',
  IM: 'Instruction Memory — holds the program',
  IR: 'Instruction Register — the fetched instruction and its fields',
  Info: 'Inspector — what each component does this stage',
  LS2: 'Left Shift 2 — shifts the immediate left by 2 for branch offsets',
  MEM: 'Memory Access — read or write data memory',
  Mem: 'Data memory contents',
  MemRead: 'Enable data-memory read',
  MemToReg: 'Selects writeback source: ALU result (0) or memory (1)',
  MemToRegMux: 'MemToReg multiplexer — selects the register write-back value',
  MemWrite: 'Enable data-memory write',
  PC: 'Program Counter — address of the current instruction',
  PCSrcMux: 'PCSrc multiplexer — selects the next PC (PC+4 or branch target)',
  RF: 'Register File — the 32 general-purpose registers',
  Reg: 'Register file contents',
  RegDst: 'Selects the write register: rt (0) or rd (1)',
  RegDstMux: 'RegDst multiplexer — selects the destination register field',
  RegWrite: 'Enable register-file write',
  SE: 'Sign Extend — extends the 16-bit immediate to 32 bits',
  Val: 'Values flowing on the datapath',
  WB: 'Write Back — write the result into the register file',
  Zero: 'ALU zero flag — high when the ALU result is 0'
}
const REG_ROLE: { pre: string; role: string }[] = [
  { pre: '$zero', role: 'constant 0' },
  { pre: '$at', role: 'assembler temporary' },
  { pre: '$v', role: 'function return value' },
  { pre: '$a', role: 'function argument' },
  { pre: '$t', role: 'temporary (caller-saved)' },
  { pre: '$s', role: 'saved (callee-saved)' },
  { pre: '$k', role: 'kernel-reserved' },
  { pre: '$gp', role: 'global pointer' },
  { pre: '$sp', role: 'stack pointer' },
  { pre: '$fp', role: 'frame pointer' },
  { pre: '$ra', role: 'return address' }
]
const glossaryFor = (key: string): string | undefined => {
  if (key in GLOSSARY) return GLOSSARY[key]
  const reg = REG_ROLE.find(r => key.startsWith(r.pre))
  return reg === undefined ? undefined : `${key} — ${reg.role}`
}
export { GLOSSARY, glossaryFor }
