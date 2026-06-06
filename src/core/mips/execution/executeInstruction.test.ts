import { describe, expect, it } from 'vitest';
import type {
    MipsInstructionFields,
    RegisterNumber,
} from '../../../types/mips';
import { executeInstruction } from './executeInstruction';
import {
    createInitialMachineState,
    type MachineState,
} from '../single-cycle/execution/machineState';

function createMachine(
    registers: Partial<Record<RegisterNumber, number>> = {},
    dataMemory: Record<number, number> = {},
    pc = 0,
): MachineState {
    const machine = createInitialMachineState();
    return {
        ...machine,
        pc,
        registers: { ...machine.registers, ...registers },
        dataMemory: { ...machine.dataMemory, ...dataMemory },
    };
}

describe('executeInstruction', () => {
    it('executes add and writes the destination register', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'add',
            rs: 9,
            rt: 10,
            rd: 8,
            immediate: 0,
            funct: 0x20,
        };

        const result = executeInstruction(
            createMachine({ 9: 5, 10: 7 }),
            instruction,
        );

        expect(result.registers[8]).toBe(12);
        expect(result.pc).toBe(4);
    });

    it('executes addi and writes the destination register', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'addi',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: 4,
        };

        const result = executeInstruction(createMachine({ 9: 5 }), instruction);

        expect(result.registers[8]).toBe(9);
        expect(result.pc).toBe(4);
    });

    it('executes lw by reading memory and writing a register', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'lw',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: 4,
        };

        const result = executeInstruction(
            createMachine({ 9: 100 }, { 104: 42 }),
            instruction,
        );

        expect(result.registers[8]).toBe(42);
        expect(result.pc).toBe(4);
    });

    it('executes sw by writing a register value to memory', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'sw',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: 4,
        };

        const result = executeInstruction(
            createMachine({ 8: 42, 9: 100 }),
            instruction,
        );

        expect(result.dataMemory[104]).toBe(42);
        expect(result.pc).toBe(4);
    });

    it('executes beq by updating PC when registers are equal', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'beq',
            rs: 8,
            rt: 9,
            rd: 0,
            immediate: 2,
        };

        const result = executeInstruction(
            createMachine({ 8: 11, 9: 11 }, {}, 100),
            instruction,
        );

        expect(result.pc).toBe(112);
    });

    it('executes bne by updating PC when registers are not equal', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'bne',
            rs: 8,
            rt: 9,
            rd: 0,
            immediate: 2,
        };

        const result = executeInstruction(
            createMachine({ 8: 11, 9: 12 }, {}, 100),
            instruction,
        );

        expect(result.pc).toBe(112);
    });

    it('does not modify register 0', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'add',
            rs: 9,
            rt: 10,
            rd: 0,
            immediate: 0,
            funct: 0x20,
        };

        const result = executeInstruction(
            createMachine({ 9: 5, 10: 7 }),
            instruction,
        );

        expect(result.registers[0]).toBe(0);
        expect(result.pc).toBe(4);
    });
});
