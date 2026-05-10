import type { ControlSignals, DatapathInstructionFields, DatapathPath, DatapathStage } from "../../types/mips";
import type { ExecutionContext } from "./executionContext";

export default function datapathStepPaths(
    stage: DatapathStage,
    instruction: DatapathInstructionFields,
    signals: ControlSignals,
    context: ExecutionContext,
): DatapathPath[] {
    void instruction;

    if (stage === 'IF') {
        return [
            'PC_TO_IM',
            'PC_TO_ADD4',
            'CONST4_TO_ADD4',
            'IM_TO_IR',
        ] as DatapathPath[];
    }

    if (stage === 'ID') {
        return [
            'IR_RS_TO_RF_RR1',
            'IR_RT_TO_RF_RR2',
            ...(signals.RegDst === 'X' ? [] : signals.RegDst === 0 ? ['IR_RT_TO_REGDST_MUX0'] : ['IR_RD_TO_REGDST_MUX1']),
            ...(signals.RegDst !== 'X' && signals.RegWrite === 1 ? ['REGDST_MUX_TO_RF_WR'] : []),
        ] as DatapathPath[];
    }

    if (stage === 'EX') {
        return [
            'RF_RD1_TO_ALU1',
            'ALUSRC_MUX_TO_ALU2',
            ...(signals.ALUSrc === 1 || signals.Branch === 1 || signals.BranchNE === 1 ? ['IR_IMM_TO_SIGN_EXTEND'] : []),
            ...(signals.Branch === 1 || signals.BranchNE === 1 ? ['SIGN_EXTEND_TO_LEFT_SHIFT_2', 'LEFT_SHIFT_2_TO_BRANCH_ADDER1', 'ADD4_TO_BRANCH_ADDER0'] : []),
            ...(signals.ALUSrc === 0 ? ['RF_RD2_TO_ALUSRC_MUX0'] : ['SIGN_EXTEND_TO_ALUSRC_MUX1']),
        ] as DatapathPath[];
    }

    if (stage === 'MEM') {
        return [
            ...(signals.MemRead === 1 || signals.MemWrite === 1 ? ['ALU_TO_DM_ADDR'] : []),
            ...((signals.Branch === 1 && context.isZero === true) || (signals.BranchNE === 1 && context.isZero === false) ? ['BRANCH_ADDER_TO_PCSRC_MUX1'] : ['ADD4_TO_PCSRC_MUX0']),
            'PCSRC_MUX_TO_PC',
        ] as DatapathPath[];
    }

    if (stage === 'WB') {
        return [
            ...(signals.MemToReg === 0 ? ['ALU_TO_MEMTOREG_MUX0'] : []),
            ...(signals.MemToReg === 1 ? ['DM_RD_TO_MEMTOREG_MUX1'] : []),
            ...(signals.MemToReg !== 'X' ? ['MEMTOREG_MUX_TO_RF_WD'] : []),
        ] as DatapathPath[];
    }

    return [];
}