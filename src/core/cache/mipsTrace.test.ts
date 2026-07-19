import { describe, expect, it } from 'vitest';
import type { MipsInstructionFields } from '../../types/mips';
import {
    createInitialMachineState,
    writeRegister,
} from '../mips/single-cycle/execution/machineState';
import {
    buildMipsCacheTrace,
    getCacheMemoryAddress,
    parseInstructionBaseAddress,
    selectMipsCacheAccesses,
} from './mipsTrace';

function memoryInstruction(
    mnemonic: 'lw' | 'sw',
    immediate = 4,
): MipsInstructionFields {
    return { mnemonic, rs: 9, rt: 8, rd: 0, immediate };
}

describe('buildMipsCacheTrace', () => {
    it('collects reads and writes until the program finishes', () => {
        const source = [
            'addi $s0, $zero, 256',
            'lw $t0, 0($s0)',
            'sw $t0, 4($s0)',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(result.dataAccesses).toEqual([
            {
                ordinal: 0,
                operation: 'read',
                address: 256,
                label: 'lw $t0, 0($s0)',
            },
            {
                ordinal: 1,
                operation: 'write',
                address: 260,
                label: 'sw $t0, 4($s0)',
            },
        ]);
        expect(result.steps).toHaveLength(3);
        expect(result.errors).toEqual([]);
        expect(result.truncated).toBe(false);
    });

    it('uses the supplied initial register values', () => {
        const initialMachine = writeRegister(
            createInitialMachineState(),
            16,
            0x100,
        );

        const result = buildMipsCacheTrace('lw $t0, 8($s0)', initialMachine);

        expect(result.dataAccesses[0]).toMatchObject({
            operation: 'read',
            address: 0x108,
        });
    });

    it('uses register changes when calculating later addresses', () => {
        const source = [
            'addi $s0, $zero, 256',
            'lw $t0, 0($s0)',
            'addi $s0, $s0, 16',
            'lw $t1, 0($s0)',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(result.dataAccesses.map((access) => access.address)).toEqual([
            256, 272,
        ]);
    });

    it('executes memory writes that affect later addresses', () => {
        const source = [
            'addi $s0, $zero, 100',
            'addi $t0, $zero, 200',
            'sw $t0, 0($s0)',
            'lw $s1, 0($s0)',
            'lw $t1, 0($s1)',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(result.dataAccesses.map((access) => access.address)).toEqual([
            100, 100, 200,
        ]);
        expect(result.dataAccesses.map((access) => access.operation)).toEqual([
            'write',
            'read',
            'read',
        ]);
    });

    it('does not record an instruction skipped by a taken branch', () => {
        const source = [
            'addi $t0, $zero, 1',
            'beq $t0, $t0, Skip',
            'lw $t1, 0($zero)',
            'Skip: sw $t0, 4($zero)',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(result.dataAccesses).toHaveLength(1);
        expect(result.dataAccesses[0]).toMatchObject({
            operation: 'write',
            address: 4,
        });
    });

    it('records every dynamic access inside a loop', () => {
        const source = [
            'addi $s0, $zero, 100',
            'addi $s1, $zero, 112',
            'Loop: lw $t0, 0($s0)',
            'addi $s0, $s0, 4',
            'bne $s0, $s1, Loop',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(result.dataAccesses.map((access) => access.address)).toEqual([
            100, 104, 108,
        ]);
        expect(result.dataAccesses.map((access) => access.ordinal)).toEqual([
            0, 1, 2,
        ]);
    });

    it('returns no accesses when the program does not use data memory', () => {
        const result = buildMipsCacheTrace(
            'addi $t0, $zero, 10',
            createInitialMachineState(),
        );

        expect(result.dataAccesses).toEqual([]);
        expect(result.steps).toHaveLength(1);
        expect(result.errors).toEqual([]);
        expect(result.truncated).toBe(false);
    });

    it('finishes when the pc advances past the final instruction', () => {
        const initialMachine = {
            ...createInitialMachineState(),
            pc: 40,
        };

        const result = buildMipsCacheTrace(
            'addi $t0, $zero, 10',
            initialMachine,
        );

        expect(result.steps).toHaveLength(1);
        expect(result.steps[0].instructionIndex).toBe(0);
        expect(result.steps[0].machineAfter.pc).toBe(4);
        expect(result.truncated).toBe(false);
    });

    it('stores the machine after every executed instruction', () => {
        const source = [
            'addi $s0, $zero, 256',
            'addi $s0, $s0, 4',
            'lw $t0, 0($s0)',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(result.steps.map((step) => step.instructionIndex)).toEqual([
            0, 1, 2,
        ]);
        expect(result.steps.map((step) => step.machineAfter.pc)).toEqual([
            4, 8, 12,
        ]);
        expect(result.steps[0].machineAfter.registers[16]).toBe(256);
        expect(result.steps[1].machineAfter.registers[16]).toBe(260);
    });

    it('maps assembly steps to completed cache accesses', () => {
        const source = [
            'addi $s0, $zero, 256',
            'lw $t0, 0($s0)',
            'addi $s0, $s0, 4',
            'sw $t0, 0($s0)',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(
            result.steps.map((step) => step.cacheDataAccessCountAfter),
        ).toEqual([0, 1, 1, 2]);
    });

    it('stores only instructions executed through a taken branch', () => {
        const source = [
            'addi $t0, $zero, 1',
            'beq $t0, $t0, Skip',
            'lw $t1, 0($zero)',
            'Skip: sw $t0, 4($zero)',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(result.steps.map((step) => step.instructionIndex)).toEqual([
            0, 1, 3,
        ]);
        expect(
            result.steps.map((step) => step.cacheDataAccessCountAfter),
        ).toEqual([0, 0, 1]);
    });

    it('returns assembly errors without executing the program', () => {
        const result = buildMipsCacheTrace(
            'j MissingLabel',
            createInitialMachineState(),
        );

        expect(result.dataAccesses).toEqual([]);
        expect(result.instructionAccesses).toEqual([]);
        expect(result.errors).toEqual([
            { line: 1, message: 'undefined label: MissingLabel' },
        ]);
        expect(result.truncated).toBe(false);
    });

    it('keeps the partial trace when the instruction limit is reached', () => {
        const source = ['Loop: lw $t0, 0($zero)', 'j Loop'].join('\n');

        const result = buildMipsCacheTrace(
            source,
            createInitialMachineState(),
            5,
        );

        // Five instructions execute: lw, j, lw, j, lw.
        expect(result.dataAccesses).toHaveLength(3);
        expect(result.instructionAccesses).toHaveLength(5);
        expect(result.errors).toEqual([]);
        expect(result.truncated).toBe(true);
    });

    it('generates one instruction-cache read per executed instruction', () => {
        const source = [
            'addi $t0, $zero, 1',
            'lw $t1, 0($zero)',
            'add $t2, $t0, $t1',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(
            result.instructionAccesses.map((access) => access.address),
        ).toEqual([0x00400000, 0x00400004, 0x00400008]);
        expect(
            result.instructionAccesses.map((access) => access.operation),
        ).toEqual(['read', 'read', 'read']);
        expect(
            result.instructionAccesses.map((access) => access.sourceLine),
        ).toEqual([1, 2, 3]);
    });

    it('keeps original source line numbers for instruction accesses', () => {
        const source = [
            '# setup',
            '',
            'Start: addi $t0, $zero, 1',
            '',
            'add $t1, $t0, $t0',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(
            result.instructionAccesses.map((access) => access.sourceLine),
        ).toEqual([3, 5]);
    });

    it('generates instruction accesses only along the executed branch path', () => {
        const source = [
            'beq $zero, $zero, Skip',
            'lw $t0, 0($zero)',
            'Skip: addi $t1, $zero, 1',
        ].join('\n');

        const result = buildMipsCacheTrace(source, createInitialMachineState());

        expect(
            result.instructionAccesses.map((access) => access.address),
        ).toEqual([0x00400000, 0x00400008]);
        expect(result.dataAccesses).toEqual([]);
    });

    it('uses a custom instruction base address', () => {
        const result = buildMipsCacheTrace(
            ['addi $t0, $zero, 1', 'addi $t1, $zero, 2'].join('\n'),
            createInitialMachineState(),
            1000,
            0x1000,
        );

        expect(
            result.instructionAccesses.map((access) => access.address),
        ).toEqual([0x1000, 0x1004]);
        expect(result.instructionBaseAddress).toBe(0x1000);
        expect(result.instructionCount).toBe(2);
    });
});

describe('selectMipsCacheAccesses', () => {
    const trace = buildMipsCacheTrace(
        ['lw $t0, 0($zero)', 'sw $t0, 4($zero)', 'lw $t1, 8($zero)'].join('\n'),
        createInitialMachineState(),
    );

    it('selects and renumbers data reads only', () => {
        expect(
            selectMipsCacheAccesses(trace, 'read-only').map(
                ({ ordinal, operation, address }) => ({
                    ordinal,
                    operation,
                    address,
                }),
            ),
        ).toEqual([
            { ordinal: 0, operation: 'read', address: 0 },
            { ordinal: 1, operation: 'read', address: 8 },
        ]);
    });

    it('selects both data reads and writes', () => {
        expect(
            selectMipsCacheAccesses(trace, 'read-write').map(
                ({ operation }) => operation,
            ),
        ).toEqual(['read', 'write', 'read']);
    });

    it('selects one instruction fetch per executed instruction', () => {
        expect(
            selectMipsCacheAccesses(trace, 'instruction').map(
                ({ ordinal, operation, address }) => ({
                    ordinal,
                    operation,
                    address,
                }),
            ),
        ).toEqual([
            { ordinal: 0, operation: 'read', address: 0x00400000 },
            { ordinal: 1, operation: 'read', address: 0x00400004 },
            { ordinal: 2, operation: 'read', address: 0x00400008 },
        ]);
    });
});

describe('MIPS cache address helpers', () => {
    it('returns read and write accesses for lw and sw', () => {
        const machine = writeRegister(createInitialMachineState(), 9, 0x100);

        expect(getCacheMemoryAddress(machine, memoryInstruction('lw'))).toEqual(
            { address: 0x104, operation: 'read' },
        );
        expect(
            getCacheMemoryAddress(machine, memoryInstruction('sw', 8)),
        ).toEqual({ address: 0x108, operation: 'write' });
    });

    it('returns null for an instruction without a data-memory access', () => {
        const fields: MipsInstructionFields = {
            mnemonic: 'add',
            rs: 9,
            rt: 10,
            rd: 8,
            immediate: 0,
        };

        expect(
            getCacheMemoryAddress(createInitialMachineState(), fields),
        ).toBeNull();
    });

    it('accepts grouped hexadecimal and decimal instruction addresses', () => {
        expect(parseInstructionBaseAddress('0x0040 003C', 'hexadecimal')).toBe(
            0x0040003c,
        );
        expect(parseInstructionBaseAddress('4 194 304', 'decimal')).toBe(
            4194304,
        );
    });

    it('rejects malformed, misaligned, and out-of-range instruction addresses', () => {
        expect(
            parseInstructionBaseAddress('0x0040003G', 'hexadecimal'),
        ).toBeNull();
        expect(
            parseInstructionBaseAddress('0x0040003E', 'hexadecimal'),
        ).toBeNull();
        expect(
            parseInstructionBaseAddress('0x100000000', 'hexadecimal'),
        ).toBeNull();
    });
});
