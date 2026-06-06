import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    DatapathInstructionFields,
    RegisterNumber,
} from '../../../types/mips';
import { datapathInstructionExamples } from '../instruction/datapathInstructionExamples';
import { getDatapathControlSignals } from './control/datapathControl';
import type { RuntimeControlSignals } from './control/types';
import { executeDatapathStep } from './execution/executeDatapathStep';
import type { ExecutionContext } from './execution/executionContext';
import {
    createEmptyExecutionContext,
} from './execution/executionContext';
import {
    createInitialMachineState,
    type MachineState,
} from './execution/machineState';

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

function createSignals(
    mnemonic: DatapathInstructionFields['mnemonic'],
    overrides: Record<string, unknown> = {},
): RuntimeControlSignals {
    return {
        ...getDatapathControlSignals(mnemonic),
        ...overrides,
    } as RuntimeControlSignals;
}

function runStepSequence(
    machine: MachineState,
    instruction: DatapathInstructionFields,
    signals = createSignals(instruction.mnemonic),
    steps: Array<'IF' | 'ID' | 'EX'> = ['IF', 'ID', 'EX'],
): { machine: MachineState; context: ExecutionContext } {
    let nextMachine = machine;
    let context = createEmptyExecutionContext();

    for (const step of steps) {
        const result = executeDatapathStep(
            nextMachine,
            context,
            instruction,
            signals,
            step,
            true,
        );
        nextMachine = result.machineState;
        context = result.executionContext;
    }

    return { machine: nextMachine, context };
}

describe('executeDatapathStep', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('IF computes PC + 4 and logs fetch behavior', () => {
        const instruction = datapathInstructionExamples.add;
        const result = executeDatapathStep(
            createMachine({}, {}, 100),
            createEmptyExecutionContext(),
            instruction,
            createSignals('add'),
            'IF',
            true,
        );

        expect(result.executionContext.pcPlus4).toBe(104);
        expect(result.executionContext.instruction).toBe(instruction);
        expect(result.executionContext.logs.join('\n')).toContain(
            '[IF] INSTRUCTION FETCH',
        );
    });

    it('ID reads rs and rt correctly', () => {
        const result = executeDatapathStep(
            createMachine({ 9: 5, 10: 7 }),
            createEmptyExecutionContext(),
            datapathInstructionExamples.add,
            createSignals('add'),
            'ID',
            true,
        );

        expect(result.executionContext.readReg1).toBe(9);
        expect(result.executionContext.readReg2).toBe(10);
        expect(result.executionContext.readData1).toBe(5);
        expect(result.executionContext.readData2).toBe(7);
        expect(result.executionContext.writeReg).toBe(8);
    });

    it('ID infers the immediate from IR[15:0]', () => {
        const result = executeDatapathStep(
            createMachine({ 9: 5, 10: 7 }),
            createEmptyExecutionContext(),
            datapathInstructionExamples.add,
            createSignals('add'),
            'ID',
            true,
        );

        expect(result.executionContext.immediate).toBe(0x4020);
    });

    it('ID selects write register from IR fields when RegDst changes', () => {
        const instruction: DatapathInstructionFields = {
            mnemonic: 'addi',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: 0x5804,
        };

        const result = executeDatapathStep(
            createMachine({ 9: 5, 10: 7 }),
            createEmptyExecutionContext(),
            instruction,
            createSignals('addi', { RegDst: 1 }),
            'ID',
            true,
        );

        expect(result.executionContext.readReg1).toBe(9);
        expect(result.executionContext.readReg2).toBe(8);
        expect(result.executionContext.writeReg).toBe(11);
        expect(result.executionContext.immediate).toBe(0x5804);
    });

    it('EX computes ALU result for add and sets zero flag', () => {
        const { context } = runStepSequence(
            createMachine({ 9: 5, 10: 7 }),
            datapathInstructionExamples.add,
        );

        expect(context.aluOp).toBe('add');
        expect(context.aluResult).toBe(12);
        expect(context.isZero).toBe(false);
    });

    it('EX computes ALU result for sub and sets zero flag', () => {
        const { context } = runStepSequence(
            createMachine({ 9: 7, 10: 7 }),
            datapathInstructionExamples.sub,
        );

        expect(context.aluOp).toBe('sub');
        expect(context.aluResult).toBe(0);
        expect(context.isZero).toBe(true);
    });

    it('MEM reads memory when MemRead = 1', () => {
        const { context } = runStepSequence(
            createMachine({ 9: 100 }, { 104: 42 }),
            datapathInstructionExamples.lw,
        );

        const result = executeDatapathStep(
            createMachine({ 9: 100 }, { 104: 42 }),
            context,
            datapathInstructionExamples.lw,
            createSignals('lw'),
            'MEM',
            true,
        );

        expect(result.executionContext.memAddress).toBe(104);
        expect(result.executionContext.memReadData).toBe(42);
        expect(result.warnings).toEqual([]);
    });

    it('MEM writes memory when MemWrite = 1', () => {
        const machine = createMachine({ 8: 42, 9: 100 });
        const { context } = runStepSequence(
            machine,
            datapathInstructionExamples.sw,
        );

        const result = executeDatapathStep(
            machine,
            context,
            datapathInstructionExamples.sw,
            createSignals('sw'),
            'MEM',
            true,
        );

        expect(result.executionContext.memAddress).toBe(104);
        expect(result.executionContext.memWriteData).toBe(42);
        expect(result.machineState.dataMemory[104]).toBe(42);
        expect(result.warnings).toEqual([]);
    });

    it('WB writes register only when RegWrite = 1', () => {
        const machine = createMachine();
        const context: ExecutionContext = {
            ...createEmptyExecutionContext(),
            writeReg: 8,
            aluResult: 123,
        };

        const written = executeDatapathStep(
            machine,
            context,
            datapathInstructionExamples.add,
            createSignals('add', { RegWrite: 1, MemToReg: 0 }),
            'WB',
            true,
        );
        const skipped = executeDatapathStep(
            machine,
            context,
            datapathInstructionExamples.add,
            createSignals('add', { RegWrite: 0, MemToReg: 0 }),
            'WB',
            true,
        );

        expect(written.machineState.registers[8]).toBe(123);
        expect(skipped.machineState.registers[8]).toBe(0);
    });

    it('RegWrite = X does not commit a register write', () => {
        const machine = createMachine();
        const context: ExecutionContext = {
            ...createEmptyExecutionContext(),
            writeReg: 8,
            aluResult: 123,
        };

        const result = executeDatapathStep(
            machine,
            context,
            datapathInstructionExamples.add,
            createSignals('add', { RegWrite: 'X', MemToReg: 0 }),
            'WB',
            true,
        );

        expect(result.machineState.registers[8]).toBe(0);
        expect(result.warnings).toContain(
            '[WB FAULT] RegWrite=X; register write decision is undefined.',
        );
    });

    it('MemToReg = X with RegWrite = 1 warns and does not commit', () => {
        const machine = createMachine();
        const context: ExecutionContext = {
            ...createEmptyExecutionContext(),
            writeReg: 8,
            aluResult: 123,
            memReadData: 456,
        };

        const result = executeDatapathStep(
            machine,
            context,
            datapathInstructionExamples.add,
            createSignals('add', { RegWrite: 1, MemToReg: 'X' }),
            'WB',
            true,
        );

        expect(result.machineState.registers[8]).toBe(0);
        expect(result.warnings).toContain(
            '[WB FAULT] RegWrite=1 but MemToReg=X; write-back data source is undefined.',
        );
    });

    it('MemRead = 1 and MemWrite = 1 produces a warning', () => {
        const machine = createMachine({ 8: 42, 9: 100 });
        const { context } = runStepSequence(
            machine,
            datapathInstructionExamples.sw,
        );

        const result = executeDatapathStep(
            machine,
            context,
            datapathInstructionExamples.sw,
            createSignals('sw', { MemRead: 1, MemWrite: 1 }),
            'MEM',
            true,
        );

        expect(result.machineState.dataMemory[104]).toBeUndefined();
        expect(result.warnings).toContain(
            '[MEM FAULT] MemRead=1 and MemWrite=1; data memory access is undefined.',
        );
    });

    it('ALUSrc = X makes ALU operand and output undefined', () => {
        const machine = createMachine({ 9: 5, 10: 7 });
        const { context } = runStepSequence(
            machine,
            datapathInstructionExamples.add,
            createSignals('add'),
            ['IF', 'ID'],
        );

        const result = executeDatapathStep(
            machine,
            context,
            datapathInstructionExamples.add,
            createSignals('add', { ALUSrc: 'X' }),
            'EX',
            true,
        );

        expect(result.executionContext.aluOp2).toBeUndefined();
        expect(result.executionContext.aluResult).toBeUndefined();
        expect(result.executionContext.isZero).toBeUndefined();
    });
});
