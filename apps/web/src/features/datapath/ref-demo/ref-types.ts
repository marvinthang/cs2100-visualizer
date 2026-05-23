interface BaseControlSignals {
  ALUOp: '00' | '01' | '10'
  ALUSrc: 0 | 1
  Branch: 0 | 1
  BranchNE: 0 | 1
  MemRead: 0 | 1
  MemToReg: 0 | 1 | 'X'
  MemWrite: 0 | 1
  RegDst: 0 | 1 | 'X'
  RegWrite: 0 | 1
}
type ControlSignalId = keyof RuntimeControlSignals
type DatapathInspectID =
  | 'ADD4'
  | 'ALU'
  | 'ALUSRC_MUX'
  | 'BRANCH_ADDER'
  | 'DATA_MEMORY'
  | 'INSTRUCTION_MEMORY'
  | 'INSTRUCTION_REGISTER'
  | 'LEFT_SHIFT_2'
  | 'MEMTOREG_MUX'
  | 'PC'
  | 'PCSRC_MUX'
  | 'REGDST_MUX'
  | 'REGISTER_FILE'
  | 'SIGN_EXTEND'
type DatapathSegment =
  | 'ADD4_JUNCTION'
  | 'ADD4_JUNCTION_TO_BRANCH_ADDER0'
  | 'ADD4_JUNCTION_TO_PCSRC_MUX0'
  | 'ADD4_TO_ADD4_JUNCTION'
  | 'ALU_JUMP'
  | 'ALU_JUMP_TO_MEMTOREG_MUX0'
  | 'ALU_JUNCTION'
  | 'ALU_JUNCTION_ALU_JUMP'
  | 'ALU_JUNCTION_TO_DM_ADDR'
  | 'ALU_TO_ALU_JUNCTION'
  | 'ALUSRC_MUX_TO_ALU2'
  | 'BRANCH_ADDER_TO_PCSRC_MUX1'
  | 'CONST4_TO_ADD4'
  | 'DM_RD_TO_MEMTOREG_MUX1'
  | 'IM_TO_IR'
  | 'IR_IMM_TO_SIGN_EXTEND'
  | 'IR_RD_TO_REGDST_MUX1'
  | 'IR_RS_TO_RF_RR1'
  | 'IR_RT_TO_RT_JUNCTION'
  | 'LEFT_SHIFT_2_TO_BRANCH_ADDER1'
  | 'MEMTOREG_MUX_JUMP'
  | 'MEMTOREG_MUX_JUMP_TO_RF_WD'
  | 'MEMTOREG_MUX_TO_MEMTOREG_MUX_JUMP'
  | 'PC_JUNCTION'
  | 'PC_JUNCTION_TO_ADD4'
  | 'PC_JUNCTION_TO_IM'
  | 'PC_TO_PC_JUNCTION'
  | 'PCSRC_MUX_TO_PC'
  | 'RD2_JUMP'
  | 'RD2_JUMP_TO_DM_WD'
  | 'RD2_JUNCTION'
  | 'RD2_JUNCTION_TO_ALUSRC_MUX0'
  | 'RD2_JUNCTION_TO_RD2_JUMP'
  | 'REGDST_MUX_TO_RF_WR'
  | 'RF_RD1_TO_ALU1'
  | 'RF_RD2_TO_RD2_JUNCTION'
  | 'RT_JUNCTION'
  | 'RT_JUNCTION_TO_REGDST_MUX0'
  | 'RT_JUNCTION_TO_RF_RR2'
  | 'SE_JUMP1'
  | 'SE_JUMP1_TO_SE_JUMP2'
  | 'SE_JUMP2'
  | 'SE_JUMP2_TO_LEFT_SHIFT_2'
  | 'SE_JUNCTION'
  | 'SE_JUNCTION_TO_ALUSRC_MUX1'
  | 'SE_JUNCTION_TO_SE_JUMP1'
  | 'SIGN_EXTEND_TO_SE_JUNCTION'
type DatapathValueId =
  | 'ADD4'
  | 'ALU_OP1'
  | 'ALU_OP2'
  | 'ALU_RESULT'
  | 'ALU_ZERO'
  | 'BRANCH_ADDER'
  | 'DM_ADDRESS'
  | 'DM_READ_DATA'
  | 'DM_WRITE_DATA'
  | 'IM_ADDRESS'
  | 'IM_INSTRUCTION'
  | 'IR_FUNCT'
  | 'IR_IMMEDIATE'
  | 'IR_OPCODE'
  | 'IR_RD'
  | 'IR_RS'
  | 'IR_RT'
  | 'IR_SHAMT'
  | 'LEFT_SHIFT_2'
  | 'PC'
  | 'RF_RD1'
  | 'RF_RD2'
  | 'RF_RR1'
  | 'RF_RR2'
  | 'RF_WD'
  | 'RF_WR'
  | 'SIGN_EXTEND'
interface EncodedField {
  bin: string
  dec: string
  hex: string
}
interface EncodedInstruction {
  address: EncodedField
  full: EncodedField
  funct: EncodedField
  immediate: EncodedField
  opcode: EncodedField
  rd: EncodedField
  rs: EncodedField
  rt: EncodedField
  shamt: EncodedField
}
type RuntimeControlSignals = BaseControlSignals & { PCSrc?: 0 | 1 }
export type {
  ControlSignalId,
  DatapathInspectID,
  DatapathSegment,
  DatapathValueId,
  EncodedField,
  EncodedInstruction,
  RuntimeControlSignals
}
