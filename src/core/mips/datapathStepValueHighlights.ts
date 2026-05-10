import type { ControlSignals, DatapathStage, DatapathStepValueHighlights, DatapathValueId } from "../../types/mips";
import type { ExecutionContext } from "./executionContext";

export default function datapathStepValueHighlights(
    stage: DatapathStage | null,
    signals: ControlSignals,
    context: ExecutionContext
): DatapathStepValueHighlights {

    if (stage === 'IF') {
        return {
            inputs: ['PC'],
            outputs: ['IM_ADDRESS', 'IM_INSTRUCTION', 'ADD4'],
            controls: [],
        };
    }

    if (stage === 'ID') {
        return {
            inputs: [
                'IR_OPCODE',
                'IR_RS',
                'IR_RT',
                ...(signals.RegDst === 1 ? ['IR_RD'] : []),
                'IR_IMMEDIATE',
            ] as DatapathValueId[],
            outputs: [
                'RF_RR1',
                'RF_RR2',
                ...(signals.RegDst !== 'X' ? ['RF_WR'] : []),
                'RF_RD1',
                'RF_RD2',
                'SIGN_EXTEND',
            ] as DatapathValueId[],
            controls: ['RegDst'],
        };
    }

    if (stage === 'EX') {
        return {
            inputs: [
                'RF_RD1',
                ...(signals.ALUSrc === 1 || signals.Branch === 1 || signals.BranchNE === 1 ? ['SIGN_EXTEND'] : []),
                ...(signals.ALUSrc === 0 ? ['RF_RD2'] : []),
                ...(signals.Branch === 1 || signals.BranchNE === 1 ? ['ADD4'] : []),
            ] as DatapathValueId[],
            outputs: [
                'ALU_OP1',
                'ALU_OP2',
                'ALU_RESULT',
                'ALU_ZERO',
                ...(signals.Branch === 1 || signals.BranchNE === 1 ? ['LEFT_SHIFT_2', 'BRANCH_ADDER'] : []),
            ] as DatapathValueId[],
            controls: ['ALUSrc', 'ALUOp'],
        };
    }

    if (stage === 'MEM') {
        return {
            inputs: [
                'ALU_RESULT',
                'RF_RD2',
                ...(context.branchTaken === undefined ? [] : context.branchTaken ? ['BRANCH_ADDER'] : ['ADD4']),
                ...(signals.Branch === 1 || signals.BranchNE === 1 ? ['ALU_ZERO'] : []),
            ] as DatapathValueId[],
            outputs: [
                'DM_ADDRESS',
                ...(signals.MemRead === 1 ? ['DM_READ_DATA'] : []),
                'DM_WRITE_DATA',
                'PC',
            ] as DatapathValueId[],
            controls: ['MemRead', 'MemWrite', 'Branch', 'BranchNE', 'PCSrc'],
        };
    }

    if (stage === 'WB') {
        return {
            inputs: [
                ...(signals.MemToReg === 'X' ? [] : signals.MemToReg === 1 ? ['DM_READ_DATA'] : ['ALU_RESULT']),
            ] as DatapathValueId[],
            outputs: [
                ...(signals.MemToReg !== 'X' ? ['RF_WD'] : []),
            ] as DatapathValueId[],
            controls: ['MemToReg', 'RegWrite'],
        };
    }

    return {
        inputs: [],
        outputs: [],
        controls: [],
    };
}