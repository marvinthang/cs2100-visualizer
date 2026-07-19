import type { CacheAccess } from '../../types/cache';
import type { AddressFormat } from '../../types/memory';
import type { MipsInstructionFields } from '../../types/mips';
import { parseAddressToken } from '../memory/address';
import { assembleMipsProgram } from '../mips/assembly/assembleMipsProgram';
import type { ParseError } from '../mips/assembly/parseAssembly';
import { executeInstruction } from '../mips/execution/executeInstruction';
import {
    readRegister,
    type MachineState,
} from '../mips/single-cycle/execution/machineState';
import { validateCacheAddress } from './address';

type MipsMemoryAccess = {
    address: number;
    operation: 'read' | 'write';
};

export function getCacheMemoryAddress(
    machine: MachineState,
    fields: MipsInstructionFields,
): MipsMemoryAccess | null {
    if (fields.mnemonic !== 'lw' && fields.mnemonic !== 'sw') return null;

    return {
        address: (readRegister(machine, fields.rs) + fields.immediate) >>> 0,
        operation: fields.mnemonic === 'lw' ? 'read' : 'write',
    };
}

export function parseInstructionBaseAddress(
    value: string,
    format: AddressFormat,
): number | null {
    const address = parseAddressToken(value.replace(/\s+/g, ''), format);

    return address !== null && validateCacheAddress(address, 32, 4) === null
        ? address
        : null;
}

export type MipsCacheExecutionStep = {
    instructionIndex: number;
    machineAfter: MachineState;
    cacheDataAccessCountAfter: number;
};

export type MipsCacheTrace = {
    steps: MipsCacheExecutionStep[];
    dataAccesses: CacheAccess[];
    instructionAccesses: CacheAccess[];
    instructionBaseAddress: number;
    instructionCount: number;
    errors: ParseError[];
    truncated: boolean;
};

export type MipsCacheAccessMode = 'read-only' | 'read-write' | 'instruction';

export function selectMipsCacheAccesses(
    trace: MipsCacheTrace,
    mode: MipsCacheAccessMode,
): CacheAccess[] {
    const accesses =
        mode === 'instruction'
            ? trace.instructionAccesses
            : mode === 'read-only'
              ? trace.dataAccesses.filter(
                    (access) => access.operation === 'read',
                )
              : trace.dataAccesses;

    return accesses.map((access, ordinal) => ({ ...access, ordinal }));
}

const DEFAULT_MAX_STEPS = 50000;

export function buildMipsCacheTrace(
    source: string,
    initialMachine: MachineState,
    maxSteps: number = DEFAULT_MAX_STEPS,
    instructionBaseAddress: number = 0x00400000,
): MipsCacheTrace {
    const assembledProgram = assembleMipsProgram(source);

    if (assembledProgram.errors.length > 0) {
        return {
            steps: [],
            dataAccesses: [],
            instructionAccesses: [],
            instructionBaseAddress,
            instructionCount: assembledProgram.instructions.length,
            errors: assembledProgram.errors,
            truncated: false,
        };
    }

    let stepCount = 0;
    const steps: MipsCacheExecutionStep[] = [];
    const dataAccesses: CacheAccess[] = [];
    const instructionAccesses: CacheAccess[] = [];

    while (true) {
        const machine =
            stepCount === 0
                ? { ...initialMachine, pc: 0 }
                : steps[stepCount - 1].machineAfter;

        const instructionIndex = machine.pc / 4;
        const instruction = assembledProgram.instructions[instructionIndex];

        if (instruction === undefined) {
            return {
                steps,
                dataAccesses,
                instructionAccesses,
                instructionBaseAddress,
                instructionCount: assembledProgram.instructions.length,
                errors: [],
                truncated: false,
            };
        }

        if (stepCount >= maxSteps) {
            return {
                steps,
                dataAccesses,
                instructionAccesses,
                instructionBaseAddress,
                instructionCount: assembledProgram.instructions.length,
                errors: [],
                truncated: true,
            };
        }

        const memoryAccess = getCacheMemoryAddress(machine, instruction.fields);

        if (memoryAccess !== null) {
            dataAccesses.push({
                ordinal: dataAccesses.length,
                operation: memoryAccess.operation,
                address: memoryAccess.address,
                label: instruction.text,
            });
        }

        instructionAccesses.push({
            ordinal: instructionAccesses.length,
            operation: 'read',
            address: instructionBaseAddress + machine.pc,
            label: instruction.text,
            sourceLine: instruction.line,
        });

        steps.push({
            instructionIndex,
            machineAfter: executeInstruction(machine, instruction.fields),
            cacheDataAccessCountAfter: dataAccesses.length,
        });

        stepCount++;
    }
}
