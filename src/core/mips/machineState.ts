import type { RegisterNumber } from '../../types/mips';

export type MachineState = {
    pc: number;
    registers: Record<RegisterNumber, number>;
    dataMemory: Record<number, number>;
}

const RegisterNames: RegisterNumber[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];

export function createInitialMachineState(): MachineState {
    // assign 0 to all registers, and 0 to all memory addresses
    const registers = Object.fromEntries(
        RegisterNames.map((reg) => [reg, 0])
    ) as Record<RegisterNumber, number>;
    
    const dataMemory: Record<number, number> = {
    };
    
    return {
        pc: 0,
        registers,
        dataMemory
    };
}

export function readRegister(state: MachineState, regNum: RegisterNumber): number {

    return state.registers[regNum] ?? 0;
}

export function writeRegister(state: MachineState, regNum: RegisterNumber, value: number): MachineState {
    if (regNum === 0) {
        return state;
    }
    const registers = { ...state.registers, [regNum]: value };
    return { ...state, registers };
}

export function readWord(state: MachineState, address: number): number {
    return state.dataMemory[address] ?? 0;
}

export function writeWord(state: MachineState, address: number, value: number): MachineState {
    const dataMemory = { ...state.dataMemory, [address]: value };
    return { ...state, dataMemory };
}