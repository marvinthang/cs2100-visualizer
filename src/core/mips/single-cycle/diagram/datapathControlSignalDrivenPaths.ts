import type { ControlSignalId, RuntimeControlSignals } from '../control/types';
import type { DatapathPath } from './types';

type SignalValue = '0' | '1' | 'X';

type SignalDrivenPathTable = {
    [K in ControlSignalId]?: Partial<Record<SignalValue, DatapathPath[]>>;
};

const signalDrivenPathTable: SignalDrivenPathTable = {
    RegDst: {
        0: ['IR_RT_TO_REGDST_MUX0', 'REGDST_MUX_TO_RF_WR'],
        1: ['IR_RD_TO_REGDST_MUX1', 'REGDST_MUX_TO_RF_WR'],
        X: [],
    },
    ALUSrc: {
        0: ['RF_RD2_TO_ALUSRC_MUX0', 'ALUSRC_MUX_TO_ALU2'],
        1: [
            'IR_IMM_TO_SIGN_EXTEND',
            'SIGN_EXTEND_TO_ALUSRC_MUX1',
            'ALUSRC_MUX_TO_ALU2',
        ],
        X: [],
    },
    MemToReg: {
        0: ['ALU_TO_MEMTOREG_MUX0', 'MEMTOREG_MUX_TO_RF_WD'],
        1: ['DM_RD_TO_MEMTOREG_MUX1', 'MEMTOREG_MUX_TO_RF_WD'],
        X: [],
    },
    Branch: {
        0: [],
        1: [
            'IR_IMM_TO_SIGN_EXTEND',
            'SIGN_EXTEND_TO_LEFT_SHIFT_2',
            'LEFT_SHIFT_2_TO_BRANCH_ADDER1',
            'ADD4_TO_BRANCH_ADDER0',
            'BRANCH_ADDER_TO_PCSRC_MUX1',
        ],
    },
    BranchNE: {
        0: [],
        1: [
            'IR_IMM_TO_SIGN_EXTEND',
            'SIGN_EXTEND_TO_LEFT_SHIFT_2',
            'LEFT_SHIFT_2_TO_BRANCH_ADDER1',
            'ADD4_TO_BRANCH_ADDER0',
            'BRANCH_ADDER_TO_PCSRC_MUX1',
        ],
    },
    PCSrc: {
        0: ['ADD4_TO_PCSRC_MUX0', 'PCSRC_MUX_TO_PC'],
        1: ['BRANCH_ADDER_TO_PCSRC_MUX1', 'PCSRC_MUX_TO_PC'],
    },
} as const;

export function getControlSignalDrivenPathMap(
    signals: RuntimeControlSignals,
): Partial<Record<ControlSignalId, DatapathPath[]>> {
    return Object.fromEntries(
        Object.entries(signals).map(([signal, value]) => {
            const table = signalDrivenPathTable[signal as ControlSignalId];
            const path = table?.[String(value) as SignalValue];
            return [signal, path ? path : []] as const;
        }),
    );
}

export function getControlSignalDrivenPaths(
    signals: RuntimeControlSignals,
): DatapathPath[] {
    return Object.values(getControlSignalDrivenPathMap(signals)).flat();
}
