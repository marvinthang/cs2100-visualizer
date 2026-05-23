/** biome-ignore-all lint/nursery/noUndeclaredEnvVars: noise */
/** biome-ignore-all lint/nursery/useGlobalThis: noise */
/** biome-ignore-all lint/suspicious/noBitwiseOperators: noise */
/** biome-ignore-all lint/suspicious/noMisplacedAssertion: noise */
/** biome-ignore-all lint/nursery/noComponentHookFactories: noise */
/** biome-ignore-all lint/nursery/noContinue: noise */
/** biome-ignore-all lint/performance/noAwaitInLoops: noise */
/** biome-ignore-all lint/performance/noNamespaceImport: noise */
/** biome-ignore-all lint/complexity/noUselessStringRaw: noise */
/** biome-ignore-all lint/complexity/useMaxParams: noise */
/* oxlint-disable unicorn/no-array-reduce, unicorn/no-immediate-mutation, unicorn/number-literal-case, unicorn/no-process-exit, import/no-duplicates, promise/param-names, @eslint-react/naming-convention/component-name */
interface DatapathComponent {
  id: string
  pos: readonly [number, number, number]
  size: readonly [number, number, number]
  role: string
}
interface DatapathPath {
  id: string
  from: string
  to: string
}
const COMPONENTS: readonly DatapathComponent[] = [
  { id: 'PC', pos: [-11, 0, 0], role: 'Program counter, 32-bit', size: [1.2, 1.6, 1.2] },
  { id: 'IM', pos: [-8.5, 0, 0], role: 'Instruction memory, word-addressable', size: [1.8, 2, 1.4] },
  { id: 'IR', pos: [-6, 0, 0], role: 'Field decomposition of the current instruction word', size: [1, 2.4, 1] },
  { id: 'Add4', pos: [-9, 3, 0], role: 'PC + 4 adder', size: [1.2, 1, 1] },
  { id: 'BranchAdder', pos: [-2, 3.4, 0], role: '(Add4 output) + (sign-extended-immediate << 2)', size: [1.2, 1, 1] },
  { id: 'LS2', pos: [-4, 3, 0], role: 'Left-shift-2 for branch offset', size: [0.9, 0.9, 0.9] },
  { id: 'SE', pos: [-4, -1.5, 0], role: 'Sign-extend 16 to 32', size: [0.9, 0.9, 0.9] },
  { id: 'RF', pos: [-3, 0, 0], role: 'Register file, 32x32, 2 read 1 write, $zero hardwired', size: [1.8, 2.4, 1.4] },
  { id: 'ALU', pos: [1, 0, 0], role: '32-bit ALU', size: [1.6, 1.8, 1.4] },
  { id: 'ALUControl', pos: [0, -2.6, 0], role: 'Derives ALU op from ALUOp + funct', size: [1.2, 0.9, 1] },
  { id: 'DM', pos: [4.5, 0, 0], role: 'Data memory, word-addressable', size: [1.8, 2, 1.4] },
  { id: 'Control', pos: [-3, 3.6, 0], role: 'Main control unit, 9 base signals from opcode', size: [1.8, 1, 1.2] },
  { id: 'RegDstMux', pos: [-1.5, 1.4, 0], role: '2-to-1 write-register source rt vs rd', size: [0.7, 1, 0.7] },
  { id: 'ALUSrcMux', pos: [-0.5, -0.4, 0], role: '2-to-1 ALU op2 RF read2 vs sign-extended-imm', size: [0.7, 1, 0.7] },
  { id: 'MemToRegMux', pos: [7, 0, 0], role: '2-to-1 RF write data ALU vs DM read', size: [0.7, 1, 0.7] },
  { id: 'PCSrcMux', pos: [-12.5, 1.4, 0], role: '2-to-1 next PC PC+4 vs branch target', size: [0.7, 1, 0.7] },
  { id: 'Zero', pos: [2.6, 1, 0], role: 'ALU result == 0 flag', size: [0.6, 0.6, 0.6] },
  { id: 'BeqAnd', pos: [3.6, 2.2, 0], role: 'AND gate Branch and Zero', size: [0.6, 0.6, 0.6] },
  { id: 'NotGate', pos: [3.6, 1, 0], role: 'NOT of Zero', size: [0.5, 0.5, 0.5] },
  { id: 'BneAnd', pos: [4.6, 1.6, 0], role: 'AND gate BranchNE and not-Zero', size: [0.6, 0.6, 0.6] },
  { id: 'OrGate', pos: [5.6, 2.2, 0], role: 'OR of BeqAnd and BneAnd drives PCSrc', size: [0.6, 0.6, 0.6] },
  { id: 'WB', pos: [9, 0, 0], role: 'Write-back collector, RF write port', size: [0.8, 1.2, 0.8] }
]
const PATHS: readonly DatapathPath[] = [
  { from: 'PC', id: 'PC_TO_IM', to: 'IM' },
  { from: 'PC', id: 'PC_TO_ADD4', to: 'Add4' },
  { from: 'PC', id: 'CONST4_TO_ADD4', to: 'Add4' },
  { from: 'Add4', id: 'ADD4_TO_BRANCH_ADDER0', to: 'BranchAdder' },
  { from: 'Add4', id: 'ADD4_TO_PCSRC_MUX0', to: 'PCSrcMux' },
  { from: 'PCSrcMux', id: 'PCSRC_MUX_TO_PC', to: 'PC' },
  { from: 'IM', id: 'IM_TO_IR', to: 'IR' },
  { from: 'IR', id: 'IR_RS_TO_RF_RR1', to: 'RF' },
  { from: 'IR', id: 'IR_RT_TO_RF_RR2', to: 'RF' },
  { from: 'IR', id: 'IR_RT_TO_REGDST_MUX0', to: 'RegDstMux' },
  { from: 'IR', id: 'IR_RD_TO_REGDST_MUX1', to: 'RegDstMux' },
  { from: 'RegDstMux', id: 'REGDST_MUX_TO_RF_WR', to: 'RF' },
  { from: 'IR', id: 'IR_IMM_TO_SIGN_EXTEND', to: 'SE' },
  { from: 'RF', id: 'RF_RD1_TO_ALU1', to: 'ALU' },
  { from: 'RF', id: 'RF_RD2_TO_ALUSRC_MUX0', to: 'ALUSrcMux' },
  { from: 'SE', id: 'SIGN_EXTEND_TO_ALUSRC_MUX1', to: 'ALUSrcMux' },
  { from: 'ALUSrcMux', id: 'ALUSRC_MUX_TO_ALU2', to: 'ALU' },
  { from: 'SE', id: 'SIGN_EXTEND_TO_LEFT_SHIFT_2', to: 'LS2' },
  { from: 'LS2', id: 'LEFT_SHIFT_2_TO_BRANCH_ADDER1', to: 'BranchAdder' },
  { from: 'BranchAdder', id: 'BRANCH_ADDER_TO_PCSRC_MUX1', to: 'PCSrcMux' },
  { from: 'ALU', id: 'ALU_TO_DM_ADDR', to: 'DM' },
  { from: 'RF', id: 'RF_RD2_TO_DM_WD', to: 'DM' },
  { from: 'Zero', id: 'ALU_ZERO_TO_BEQ_AND_GATE', to: 'BeqAnd' },
  { from: 'Control', id: 'BRANCH_TO_BEQ_AND_GATE', to: 'BeqAnd' },
  { from: 'Zero', id: 'ALU_ZERO_TO_NOT_GATE', to: 'NotGate' },
  { from: 'NotGate', id: 'NOT_GATE_TO_BNE_AND_GATE', to: 'BneAnd' },
  { from: 'Control', id: 'BRANCHNE_TO_BNE_AND_GATE', to: 'BneAnd' },
  { from: 'BeqAnd', id: 'BEQ_AND_GATE_TO_OR_GATE', to: 'OrGate' },
  { from: 'BneAnd', id: 'BNE_AND_GATE_TO_OR_GATE', to: 'OrGate' },
  { from: 'OrGate', id: 'OR_GATE_TO_PCSRC_MUX', to: 'PCSrcMux' },
  { from: 'ALU', id: 'ALU_TO_MEMTOREG_MUX0', to: 'MemToRegMux' },
  { from: 'DM', id: 'DM_RD_TO_MEMTOREG_MUX1', to: 'MemToRegMux' },
  { from: 'MemToRegMux', id: 'MEMTOREG_MUX_TO_RF_WD', to: 'WB' },
  { from: 'IR', id: 'IR_OPCODE_TO_CONTROL', to: 'Control' },
  { from: 'Control', id: 'CONTROL_TO_REGDST_MUX', to: 'RegDstMux' },
  { from: 'Control', id: 'CONTROL_TO_ALUSRC_MUX', to: 'ALUSrcMux' },
  { from: 'Control', id: 'CONTROL_TO_MEMTOREG_MUX', to: 'MemToRegMux' },
  { from: 'Control', id: 'CONTROL_TO_REGWRITE', to: 'WB' },
  { from: 'Control', id: 'CONTROL_TO_MEMREAD', to: 'DM' },
  { from: 'Control', id: 'CONTROL_TO_MEMWRITE', to: 'DM' },
  { from: 'IR', id: 'IR_FUNCT_TO_ALU_CONTROL', to: 'ALUControl' },
  { from: 'Control', id: 'ALUOP_TO_ALU_CONTROL', to: 'ALUControl' },
  { from: 'ALUControl', id: 'ALU_CONTROL_TO_ALU', to: 'ALU' }
]
const VALUE_IDS = [
  'PC',
  'ADD4',
  'BRANCH_ADDER',
  'SIGN_EXTEND',
  'LEFT_SHIFT_2',
  'IM_ADDRESS',
  'IM_INSTRUCTION',
  'IR_OPCODE',
  'IR_RS',
  'IR_RT',
  'IR_RD',
  'IR_SHAMT',
  'IR_FUNCT',
  'IR_IMMEDIATE',
  'RF_RR1',
  'RF_RR2',
  'RF_WR',
  'RF_RD1',
  'RF_RD2',
  'RF_WD',
  'ALU_OP1',
  'ALU_OP2',
  'ALU_RESULT',
  'ALU_ZERO',
  'DM_ADDRESS',
  'DM_WRITE_DATA',
  'DM_READ_DATA'
] as const
type ValueId = (typeof VALUE_IDS)[number]
export { COMPONENTS, PATHS, VALUE_IDS }
export type { DatapathComponent, DatapathPath, ValueId }
