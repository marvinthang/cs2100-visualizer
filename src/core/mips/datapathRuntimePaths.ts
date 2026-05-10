import type { ControlSignals, DatapathPath } from '../../types/mips';

type StringifiedSignalValue = '0' | '1' | 'X' | '00' | '01' | '10';

type SignalDrivenPathTable = {
    [K in keyof ControlSignals]?: Partial<Record<StringifiedSignalValue, DatapathPath[]>>;
};

const signalDrivenPathTable: SignalDrivenPathTable = {
    RegDst: {
        0: ['IR_RT_TO_REGDST_MUX0', 'REGDST_MUX_TO_RF_WR'],
        1: ['IR_RD_TO_REGDST_MUX1', 'REGDST_MUX_TO_RF_WR'],
        X: [],
    },
    ALUSrc: {
        0: ['RF_RD2_TO_ALUSRC_MUX0', 'ALUSRC_MUX_TO_ALU2'],
        1: ['IR_IMM_TO_SIGN_EXTEND', 'SIGN_EXTEND_TO_ALUSRC_MUX1', 'ALUSRC_MUX_TO_ALU2'],
        X: [],
    },
    MemToReg: {
        0: ['ALU_TO_MEMTOREG_MUX0', 'MEMTOREG_MUX_TO_RF_WD'],
        1: ['DM_RD_TO_MEMTOREG_MUX1', 'MEMTOREG_MUX_TO_RF_WD'],
        X: [],
    },
} as const;

export function getControlSignalDrivenPathMap(signals: ControlSignals): Partial<Record<keyof ControlSignals, DatapathPath[]>> {
    return Object.fromEntries(Object.entries(signals).map(([signal, value]) => {
        const table = signalDrivenPathTable[signal as keyof ControlSignals]
        const path = table?.[String(value) as StringifiedSignalValue];
        return [signal, path ? path : []] as const;
    }))
}

export function getControlSignalDrivenPaths(signals: ControlSignals): DatapathPath[] {
    return Object.values(getControlSignalDrivenPathMap(signals)).flat();
}