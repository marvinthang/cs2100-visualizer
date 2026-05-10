export type MipsMnemonic = 
    | 'add'
    | 'addi'
    | 'and'
    | 'andi'
    | 'beq'
    | 'bne'
    | 'j'
    | 'lui'
    | 'lw'
    | 'nor'
    | 'or'
    | 'ori'
    | 'slt'
    | 'sll'
    | 'srl'
    | 'sw'
    | 'sub'
    | 'xor'
    | 'xori';

export type DatapathMnemonic =
    | 'add'
    | 'addi'
    | 'and'
    | 'beq'
    | 'bne'
    | 'lw'
    | 'slt'
    | 'or'
    | 'sw'
    | 'sub'

export type ControlSignals = {
    RegDst: 0 | 1 | 'X';
    ALUSrc: 0 | 1;
    MemToReg: 0 | 1 | 'X';
    RegWrite: 0 | 1;
    MemRead: 0 | 1;
    MemWrite: 0 | 1;
    Branch: 0 | 1;
    BranchNE: 0 | 1;
    ALUOp: '00' | '01' | '10';
}

export type DatapathPath =
    // --- Instruction Fetch ---
    | 'PC_TO_IM'
    | 'PC_TO_ADD4'
    | 'CONST4_TO_ADD4'
    | 'ADD4_TO_BRANCH_ADDER0'
    | 'ADD4_TO_PCSRC_MUX0'
    | 'PCSRC_MUX_TO_PC'

    // --- Instruction Decode  ---
    | 'IM_TO_IR'
    | 'IR_RS_TO_RF_RR1'
    | 'IR_RT_TO_RF_RR2'
    | 'IR_RT_TO_REGDST_MUX0'
    | 'IR_RD_TO_REGDST_MUX1'
    | 'REGDST_MUX_TO_RF_WR'
    | 'IR_IMM_TO_SIGN_EXTEND'

    // --- Execution / ALU ---
    | 'RF_RD1_TO_ALU1'
    | 'RF_RD2_TO_ALUSRC_MUX0'
    | 'SIGN_EXTEND_TO_ALUSRC_MUX1'
    | 'ALUSRC_MUX_TO_ALU2'
    | 'SIGN_EXTEND_TO_LEFT_SHIFT_2'
    | 'LEFT_SHIFT_2_TO_BRANCH_ADDER1'
    | 'BRANCH_ADDER_TO_PCSRC_MUX1'

    // --- Memory (Data) ---
    | 'ALU_TO_DM_ADDR'
    | 'RF_RD2_TO_DM_WD'

    // --- Memory (Branching Logic) ---
    | 'ALU_ZERO_TO_BEQ_AND_GATE'
    | 'BRANCH_TO_BEQ_AND_GATE'
    | 'ALU_ZERO_TO_NOT_GATE'
    | 'NOT_GATE_TO_BNE_AND_GATE'
    | 'BRANCHNE_TO_BNE_AND_GATE'
    | 'BEQ_AND_GATE_TO_OR_GATE'
    | 'BNE_AND_GATE_TO_OR_GATE'
    | 'OR_GATE_TO_PCSRC_MUX'

    // --- Write Back ---
    | 'ALU_TO_MEMTOREG_MUX0'
    | 'DM_RD_TO_MEMTOREG_MUX1'
    | 'MEMTOREG_MUX_TO_RF_WD'

    // --- Control Unit ---
    | 'IR_OPCODE_TO_CONTROL'
    | 'CONTROL_TO_REGDST_MUX'
    | 'CONTROL_TO_ALUSRC_MUX'
    | 'CONTROL_TO_MEMTOREG_MUX'
    | 'CONTROL_TO_REGWRITE'
    | 'CONTROL_TO_MEMREAD'
    | 'CONTROL_TO_MEMWRITE'

    // --- ALU Control ---
    | 'IR_FUNCT_TO_ALU_CONTROL'
    | 'ALUOP_TO_ALU_CONTROL'
    | 'ALU_CONTROL_TO_ALU';

export type DatapathSegment =
    // --- Instruction Fetch ---
    | 'PC_TO_PC_JUNCTION'
    | 'PC_JUNCTION'
    | 'PC_JUNCTION_TO_ADD4'
    | 'PC_JUNCTION_TO_IM'
    
    | 'ADD4_TO_ADD4_JUNCTION'
    | 'ADD4_JUNCTION'
    | 'ADD4_JUNCTION_TO_BRANCH_ADDER0'
    | 'ADD4_JUNCTION_TO_PCSRC_MUX0'

    | 'CONST4_TO_ADD4'
    
    | 'PCSRC_MUX_TO_PC'
    
    // --- Instruction Decode  ---
    | 'IM_TO_IR'

    | 'IR_RS_TO_RF_RR1'
    | 'IR_RT_TO_RT_JUNCTION'
    | 'RT_JUNCTION'
    | 'RT_JUNCTION_TO_RF_RR2'
    | 'RT_JUNCTION_TO_REGDST_MUX0'

    | 'IR_RD_TO_REGDST_MUX1'

    | 'REGDST_MUX_TO_RF_WR'
    | 'IR_IMM_TO_SIGN_EXTEND'

    // --- Execution / ALU ---
    | 'RF_RD1_TO_ALU1'

    | 'RF_RD2_TO_RD2_JUNCTION'
    | 'RD2_JUNCTION'
    | 'RD2_JUNCTION_TO_ALUSRC_MUX0'

    | 'SIGN_EXTEND_TO_SE_JUNCTION'
    | 'SE_JUNCTION'
    | 'SE_JUNCTION_TO_SE_JUMP1'
    | 'SE_JUMP1'
    | 'SE_JUMP1_TO_SE_JUMP2'
    | 'SE_JUMP2'
    | 'SE_JUMP2_TO_LEFT_SHIFT_2'
    | 'SE_JUNCTION_TO_ALUSRC_MUX1'

    | 'ALUSRC_MUX_TO_ALU2'

    | 'LEFT_SHIFT_2_TO_BRANCH_ADDER1'
    | 'BRANCH_ADDER_TO_PCSRC_MUX1'

    // --- Memory (Data) ---
    | 'ALU_TO_ALU_JUNCTION'
    | 'ALU_JUNCTION'
    | 'ALU_JUNCTION_TO_DM_ADDR'

    | 'RD2_JUNCTION_TO_RD2_JUMP'
    | 'RD2_JUMP'
    | 'RD2_JUMP_TO_DM_WD'

    // --- Memory (Branching Logic) ---
    // | 'ALU_ZERO_TO_BEQ_AND_GATE'
    // | 'BRANCH_TO_BEQ_AND_GATE'
    // | 'ALU_ZERO_TO_NOT_GATE'
    // | 'NOT_GATE_TO_BNE_AND_GATE'
    // | 'BRANCHNE_TO_BNE_AND_GATE'
    // | 'BEQ_AND_GATE_TO_OR_GATE'
    // | 'BNE_AND_GATE_TO_OR_GATE'
    // | 'OR_GATE_TO_PCSRC_MUX'

    // --- Write Back ---
    | 'ALU_JUNCTION_ALU_JUMP'
    | 'ALU_JUMP'
    | 'ALU_JUMP_TO_MEMTOREG_MUX0'

    | 'DM_RD_TO_MEMTOREG_MUX1'
    | 'MEMTOREG_MUX_TO_MEMTOREG_MUX_JUMP'
    | 'MEMTOREG_MUX_JUMP'
    | 'MEMTOREG_MUX_JUMP_TO_RF_WD'

    // --- Control Unit ---
    // | 'IR_OPCODE_TO_CONTROL'
    // | 'CONTROL_TO_REGDST_MUX'
    // | 'CONTROL_TO_ALUSRC_MUX'
    // | 'CONTROL_TO_MEMTOREG_MUX'
    // | 'CONTROL_TO_REGWRITE'
    // | 'CONTROL_TO_MEMREAD'
    // | 'CONTROL_TO_MEMWRITE'

    // --- ALU Control ---
    // | 'IR_FUNCT_TO_ALU_CONTROL'
    // | 'ALUOP_TO_ALU_CONTROL'
    // | 'ALU_CONTROL_TO_ALU';
    
export type RegisterNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31;
    
export type NumberedRegister = `$${RegisterNumber}`;

export type RegisterName = '$zero' | '$at' | '$v0' | '$v1' | '$a0' | '$a1' | '$a2' | '$a3' | '$t0' | '$t1' | '$t2' | '$t3' | '$t4' | '$t5' | '$t6' | '$t7' | '$s0' | '$s1' | '$s2' | '$s3' | '$s4' | '$s5' | '$s6' | '$s7' | '$t8' | '$t9' | '$k0' | '$k1' | '$gp' | '$sp' | '$fp' | '$ra';

export type RegisterOperand = NumberedRegister | RegisterName;

export type DatapathStage = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB';

export type InstructionFields<TMnemonic extends MipsMnemonic> = {
    mnemonic: TMnemonic;
    rs: RegisterNumber;
    rt: RegisterNumber;
    rd: RegisterNumber;
    immediate: number;
    shamt?: number;
    funct?: number;
    label?: string;
}

export type MipsInstructionFields = InstructionFields<MipsMnemonic>;

export type DatapathInstructionFields = InstructionFields<DatapathMnemonic>;
