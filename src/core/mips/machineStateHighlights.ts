import type { ControlSignals, DatapathStage, MachineStateHighlightState } from "../../types/mips";
import type { ExecutionContext } from "./executionContext";

export default function machineStateHighlights(
    stage: DatapathStage | null,
    signals: ControlSignals,
    context: ExecutionContext
): MachineStateHighlightState {
    const state: MachineStateHighlightState = {
        registers: {},
        memory: {},
    };

    if (stage === 'IF') {
        state.pc = 'input';
    } else if (stage === 'ID') {
        if (context.readReg1 !== undefined) {
            state.registers[context.readReg1] = 'output';
        }
        if (context.readReg2 !== undefined) {
            state.registers[context.readReg2] = 'output';
        }
    } else if (stage === 'EX') {
        if (context.readReg1 !== undefined) {
            state.registers[context.readReg1] = 'input';
        }
        if (context.readReg2 !== undefined && signals.ALUSrc === 0) {
            state.registers[context.readReg2] = 'input';
        }
    } else if (stage === 'MEM') {
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
    } else if (stage === 'WB') {
        if (signals.RegWrite === 1 && context.writeReg !== undefined) {
            state.registers[context.writeReg] = 'output';
        }
    }
    return state;
}