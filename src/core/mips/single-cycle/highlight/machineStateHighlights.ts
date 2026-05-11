import type { DatapathStep } from '../../../../types/mips';
import type { RuntimeControlSignals } from '../control/types';
import type { ExecutionContext } from '../execution/executionContext';
import type { MachineStateHighlightState } from './types';

export function getMachineStateHighlights(
    step: DatapathStep | null,
    signals: RuntimeControlSignals,
    context: ExecutionContext,
): MachineStateHighlightState {
    const state: MachineStateHighlightState = {
        registers: {},
        memory: {},
    };

    if (step === 'IF') {
        state.pc = 'input';
    } else if (step === 'ID') {
        if (context.readReg1 !== undefined) {
            state.registers[context.readReg1] = 'output';
        }
        if (context.readReg2 !== undefined) {
            state.registers[context.readReg2] = 'output';
        }
    } else if (step === 'EX') {
        if (context.readReg1 !== undefined) {
            state.registers[context.readReg1] = 'input';
        }
        if (context.readReg2 !== undefined && signals.ALUSrc === 0) {
            state.registers[context.readReg2] = 'input';
        }
    } else if (step === 'MEM') {
        state.pc = 'output';
        const address = context.memAddress;
        if (address !== undefined && address % 4 === 0) {
            if (signals.MemRead === 1 || signals.MemWrite === 1) {
                state.memory[address] = 'output';
            }
            if (context.readReg2 !== undefined) {
                state.registers[context.readReg2] = 'input';
            }
        }
    } else if (step === 'WB') {
        if (signals.RegWrite === 1 && context.writeReg !== undefined) {
            state.registers[context.writeReg] = 'output';
        }
    }
    return state;
}
