import type { DatapathPath, DatapathSegment } from '../../../types/mips';

export const datapathPathSegments: Partial<
    Record<DatapathPath, DatapathSegment[]>
> = {
    PC_TO_ADD4: ['PC_TO_PC_JUNCTION', 'PC_JUNCTION', 'PC_JUNCTION_TO_ADD4'],
    CONST4_TO_ADD4: ['CONST4_TO_ADD4'],
    PC_TO_IM: ['PC_TO_PC_JUNCTION', 'PC_JUNCTION', 'PC_JUNCTION_TO_IM'],
    IM_TO_IR: ['IM_TO_IR'],
    ADD4_TO_BRANCH_ADDER0: [
        'ADD4_TO_ADD4_JUNCTION',
        'ADD4_JUNCTION',
        'ADD4_JUNCTION_TO_BRANCH_ADDER0',
    ],
    ADD4_TO_PCSRC_MUX0: [
        'ADD4_TO_ADD4_JUNCTION',
        'ADD4_JUNCTION',
        'ADD4_JUNCTION_TO_PCSRC_MUX0',
    ],
    PCSRC_MUX_TO_PC: ['PCSRC_MUX_TO_PC'],
    IR_RS_TO_RF_RR1: ['IR_RS_TO_RF_RR1'],
    IR_RT_TO_RF_RR2: [
        'IR_RT_TO_RT_JUNCTION',
        'RT_JUNCTION',
        'RT_JUNCTION_TO_RF_RR2',
    ],
    IR_RT_TO_REGDST_MUX0: [
        'IR_RT_TO_RT_JUNCTION',
        'RT_JUNCTION',
        'RT_JUNCTION_TO_REGDST_MUX0',
    ],
    IR_RD_TO_REGDST_MUX1: ['IR_RD_TO_REGDST_MUX1'],
    REGDST_MUX_TO_RF_WR: ['REGDST_MUX_TO_RF_WR'],
    IR_IMM_TO_SIGN_EXTEND: ['IR_IMM_TO_SIGN_EXTEND'],
    RF_RD1_TO_ALU1: ['RF_RD1_TO_ALU1'],
    RF_RD2_TO_ALUSRC_MUX0: [
        'RF_RD2_TO_RD2_JUNCTION',
        'RD2_JUNCTION',
        'RD2_JUNCTION_TO_ALUSRC_MUX0',
    ],
    SIGN_EXTEND_TO_LEFT_SHIFT_2: [
        'SIGN_EXTEND_TO_SE_JUNCTION',
        'SE_JUNCTION',
        'SE_JUNCTION_TO_SE_JUMP1',
        'SE_JUMP1',
        'SE_JUMP1_TO_SE_JUMP2',
        'SE_JUMP2',
        'SE_JUMP2_TO_LEFT_SHIFT_2',
    ],
    SIGN_EXTEND_TO_ALUSRC_MUX1: [
        'SIGN_EXTEND_TO_SE_JUNCTION',
        'SE_JUNCTION',
        'SE_JUNCTION_TO_ALUSRC_MUX1',
    ],
    ALUSRC_MUX_TO_ALU2: ['ALUSRC_MUX_TO_ALU2'],
    LEFT_SHIFT_2_TO_BRANCH_ADDER1: ['LEFT_SHIFT_2_TO_BRANCH_ADDER1'],
    BRANCH_ADDER_TO_PCSRC_MUX1: ['BRANCH_ADDER_TO_PCSRC_MUX1'],
    ALU_TO_DM_ADDR: [
        'ALU_TO_ALU_JUNCTION',
        'ALU_JUNCTION',
        'ALU_JUNCTION_TO_DM_ADDR',
    ],
    RF_RD2_TO_DM_WD: [
        'RF_RD2_TO_RD2_JUNCTION',
        'RD2_JUNCTION',
        'RD2_JUNCTION_TO_RD2_JUMP',
        'RD2_JUMP',
        'RD2_JUMP_TO_DM_WD',
    ],
    ALU_TO_MEMTOREG_MUX0: [
        'ALU_TO_ALU_JUNCTION',
        'ALU_JUNCTION',
        'ALU_JUNCTION_ALU_JUMP',
        'ALU_JUMP',
        'ALU_JUMP_TO_MEMTOREG_MUX0',
    ],
    DM_RD_TO_MEMTOREG_MUX1: ['DM_RD_TO_MEMTOREG_MUX1'],
    MEMTOREG_MUX_TO_RF_WD: [
        'MEMTOREG_MUX_TO_MEMTOREG_MUX_JUMP',
        'MEMTOREG_MUX_JUMP',
        'MEMTOREG_MUX_JUMP_TO_RF_WD',
    ],
};

export function getActiveDatapathSegments(
    activePaths: readonly DatapathPath[],
): DatapathSegment[] {
    return activePaths.flatMap((path) => datapathPathSegments[path] ?? []);
}
