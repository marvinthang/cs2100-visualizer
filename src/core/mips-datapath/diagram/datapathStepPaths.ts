import type {
    RuntimeControlSignals,
    DatapathInstructionFields,
    DatapathPath,
    DatapathStep,
} from '../../../types/mips';
import type { ExecutionContext } from '../execution/executionContext';

export function getDatapathStepPaths(
    step: DatapathStep,
    instruction: DatapathInstructionFields,
    signals: RuntimeControlSignals,
    context: ExecutionContext,
): DatapathPath[] {
    void instruction;

    if (step === 'IF') {
        return [
            'PC_TO_IM',
            'PC_TO_ADD4',
            'CONST4_TO_ADD4',
            'IM_TO_IR',
        ] as DatapathPath[];
    }

    if (step === 'ID') {
        return [
            'IR_RS_TO_RF_RR1',
            'IR_RT_TO_RF_RR2',
            'IR_IMM_TO_SIGN_EXTEND',
            ...(signals.RegDst === 'X'
                ? []
                : signals.RegDst === 0
                  ? ['IR_RT_TO_REGDST_MUX0']
                  : ['IR_RD_TO_REGDST_MUX1']),
            ...(signals.RegDst !== 'X' ? ['REGDST_MUX_TO_RF_WR'] : []),
        ] as DatapathPath[];
    }

    if (step === 'EX') {
        return [
            'RF_RD1_TO_ALU1',
            'ALUSRC_MUX_TO_ALU2',
            ...(signals.Branch === 1 || signals.BranchNE === 1
                ? [
                      'SIGN_EXTEND_TO_LEFT_SHIFT_2',
                      'LEFT_SHIFT_2_TO_BRANCH_ADDER1',
                      'ADD4_TO_BRANCH_ADDER0',
                  ]
                : []),
            ...(signals.ALUSrc === 0
                ? ['RF_RD2_TO_ALUSRC_MUX0']
                : ['SIGN_EXTEND_TO_ALUSRC_MUX1']),
        ] as DatapathPath[];
    }

    if (step === 'MEM') {
        return [
            'ALU_TO_DM_ADDR',
            'RF_RD2_TO_DM_WD',
            ...(context.branchTaken === undefined
                ? []
                : context.branchTaken
                  ? ['BRANCH_ADDER_TO_PCSRC_MUX1']
                  : ['ADD4_TO_PCSRC_MUX0']),
            'PCSRC_MUX_TO_PC',
        ] as DatapathPath[];
    }

    if (step === 'WB') {
        return [
            ...(signals.MemToReg === 0 ? ['ALU_TO_MEMTOREG_MUX0'] : []),
            ...(signals.MemToReg === 1 ? ['DM_RD_TO_MEMTOREG_MUX1'] : []),
            ...(signals.MemToReg !== 'X' ? ['MEMTOREG_MUX_TO_RF_WD'] : []),
        ] as DatapathPath[];
    }

    return [];
}
