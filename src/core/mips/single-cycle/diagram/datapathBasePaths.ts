import type { DatapathMnemonic } from '../../../../types/mips';
import type { DatapathPath } from './types';

const commonFetchPaths: DatapathPath[] = [
    'PC_TO_IM',
    'PC_TO_ADD4',
    'CONST4_TO_ADD4',
    'ADD4_TO_PCSRC_MUX0',
    'PCSRC_MUX_TO_PC',
    'IM_TO_IR',
    'IR_OPCODE_TO_CONTROL',
];

const rTypePaths: DatapathPath[] = [
    ...commonFetchPaths,
    'IR_RS_TO_RF_RR1',
    'IR_RT_TO_RF_RR2',
    'RF_RD1_TO_ALU1',
    // Control Wires
    // 'CONTROL_TO_REGDST_MUX',
    // 'CONTROL_TO_ALUSRC_MUX',
    // 'CONTROL_TO_MEMTOREG_MUX',
    // 'CONTROL_TO_REGWRITE',
    // 'IR_FUNCT_TO_ALU_CONTROL',
    // 'ALUOP_TO_ALU_CONTROL',
    // 'ALU_CONTROL_TO_ALU',
];

const addiPaths: DatapathPath[] = [
    ...commonFetchPaths,
    'IR_RS_TO_RF_RR1',
    'IR_IMM_TO_SIGN_EXTEND',
    'RF_RD1_TO_ALU1',
    // Control Wires
    // 'CONTROL_TO_REGDST_MUX',
    // 'CONTROL_TO_ALUSRC_MUX',
    // 'CONTROL_TO_MEMTOREG_MUX',
    // 'CONTROL_TO_REGWRITE',
    // 'ALUOP_TO_ALU_CONTROL',
    // 'ALU_CONTROL_TO_ALU',
];

const lwPaths: DatapathPath[] = [
    ...commonFetchPaths,
    'IR_RS_TO_RF_RR1',
    'IR_IMM_TO_SIGN_EXTEND',
    'RF_RD1_TO_ALU1',
    'ALU_TO_DM_ADDR',
    // Control Wires
    // 'CONTROL_TO_REGDST_MUX',
    // 'CONTROL_TO_ALUSRC_MUX',
    // 'CONTROL_TO_MEMTOREG_MUX',
    // 'CONTROL_TO_REGWRITE',
    // 'CONTROL_TO_MEMREAD',
    // 'ALUOP_TO_ALU_CONTROL',
    // 'ALU_CONTROL_TO_ALU',
];

const swPaths: DatapathPath[] = [
    ...commonFetchPaths,
    'IR_RS_TO_RF_RR1',
    'IR_RT_TO_RF_RR2',
    'IR_IMM_TO_SIGN_EXTEND',
    'RF_RD1_TO_ALU1',
    'ALU_TO_DM_ADDR',
    'RF_RD2_TO_DM_WD',
    // Control Wires
    // 'CONTROL_TO_ALUSRC_MUX',
    // 'CONTROL_TO_MEMWRITE',
    // 'ALUOP_TO_ALU_CONTROL',
    // 'ALU_CONTROL_TO_ALU',
];

const commonBranchPaths: DatapathPath[] = [
    ...commonFetchPaths,
    'IR_RS_TO_RF_RR1',
    'IR_RT_TO_RF_RR2',
    'IR_IMM_TO_SIGN_EXTEND',
    'RF_RD1_TO_ALU1',
    // 'SIGN_EXTEND_TO_LEFT_SHIFT_2',
    // 'LEFT_SHIFT_2_TO_BRANCH_ADDER1',
    // 'ADD4_TO_BRANCH_ADDER0',
    // 'BRANCH_ADDER_TO_PCSRC_MUX1',
    // 'OR_GATE_TO_PCSRC_MUX',
    // Control Wires
    // 'CONTROL_TO_ALUSRC_MUX',
    // 'ALUOP_TO_ALU_CONTROL',
    // 'ALU_CONTROL_TO_ALU',
];

const beqPaths: DatapathPath[] = [
    ...commonBranchPaths,
    // 'ALU_ZERO_TO_BEQ_AND_GATE',
    // 'BRANCH_TO_BEQ_AND_GATE',
    // 'BEQ_AND_GATE_TO_OR_GATE',
];

const bnePaths: DatapathPath[] = [
    ...commonBranchPaths,
    // 'ALU_ZERO_TO_NOT_GATE',
    // 'NOT_GATE_TO_BNE_AND_GATE',
    // 'BRANCHNE_TO_BNE_AND_GATE',
    // 'BNE_AND_GATE_TO_OR_GATE',
];

export const datapathPathTable: Record<DatapathMnemonic, DatapathPath[]> = {
    add: rTypePaths,
    sub: rTypePaths,
    and: rTypePaths,
    or: rTypePaths,
    slt: rTypePaths,
    addi: addiPaths,
    lw: lwPaths,
    sw: swPaths,
    beq: beqPaths,
    bne: bnePaths,
};

export function getActiveDatapathBasePaths(
    mnemonic: DatapathMnemonic,
): DatapathPath[] {
    return datapathPathTable[mnemonic];
}
