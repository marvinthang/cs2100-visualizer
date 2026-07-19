import { describe, expect, it } from 'vitest';
import type { MipsArrayDefinitionDraft } from '../../../types/mips';
import {
    createInitialMachineState,
    readRegister,
} from '../single-cycle/execution/machineState';
import { prepareMipsArrays } from './prepareMipsArrays';
import { calculateMipsArrayDraftBaseAddress } from '../arrayDefinitionDraft';

function array(
    overrides: Partial<MipsArrayDefinitionDraft> = {},
): MipsArrayDefinitionDraft {
    return {
        name: 'A',
        addressMode: 'fixed',
        baseAddress: '100',
        lengthMode: 'fixed',
        length: '8',
        addressFormat: 'hexadecimal',
        baseAddressRegister: 16,
        lengthRegister: 17,
        valuePattern: '',
        ...overrides,
    };
}

describe('prepareMipsArrays', () => {
    it('recalculates automatic draft addresses from current preceding values', () => {
        const drafts = [
            array(),
            array({
                name: 'B',
                addressMode: 'after-previous' as const,
                baseAddressRegister: 18,
            }),
        ];

        expect(calculateMipsArrayDraftBaseAddress(drafts, 1)).toBe(0x120);

        drafts[0] = array({ baseAddress: '200', length: '4' });

        expect(calculateMipsArrayDraftBaseAddress(drafts, 1)).toBe(0x210);
    });

    it('writes the array base address and length into the selected registers', () => {
        const result = prepareMipsArrays(createInitialMachineState(), [
            array(),
        ]);

        expect(result.errors).toEqual([]);
        expect(readRegister(result.machine, 16)).toBe(0x100);
        expect(readRegister(result.machine, 17)).toBe(8);
        expect(result.definitions).toEqual([
            {
                name: 'A',
                baseAddress: 0x100,
                length: 8,
                elementSizeBytes: 4,
            },
        ]);
    });

    it('fills the array by repeating space- or comma-separated values', () => {
        const result = prepareMipsArrays(createInitialMachineState(), [
            array({ length: '7', valuePattern: '1, 2 3' }),
        ]);

        expect(result.errors).toEqual([]);
        expect(
            Array.from(
                { length: 7 },
                (_, index) => result.machine.dataMemory[0x100 + index * 4],
            ),
        ).toEqual([1, 2, 3, 1, 2, 3, 1]);
    });

    it('leaves existing memory unchanged when the value pattern is blank', () => {
        const machine = {
            ...createInitialMachineState(),
            dataMemory: { 0x100: 9, 0x104: 8 },
        };

        const result = prepareMipsArrays(machine, [array({ length: '2' })]);

        expect(result.errors).toEqual([]);
        expect(result.machine.dataMemory).toBe(machine.dataMemory);
        expect(result.machine.dataMemory).toEqual({ 0x100: 9, 0x104: 8 });
    });

    it('rejects an invalid array value pattern without changing the machine', () => {
        const machine = createInitialMachineState();
        const result = prepareMipsArrays(machine, [
            array({ valuePattern: '1 nope 3' }),
        ]);

        expect(result.machine).toBe(machine);
        expect(result.errors).toEqual([
            'Array A: enter decimal values separated by spaces or commas.',
        ]);
    });

    it('does not fill values beyond the 32-bit address space', () => {
        const machine = createInitialMachineState();
        const result = prepareMipsArrays(machine, [
            array({
                baseAddress: 'FFFFFFFC',
                length: '2',
                valuePattern: '1',
            }),
        ]);

        expect(result.machine).toBe(machine);
        expect(result.errors).toEqual([
            'Array "A" extends beyond the 32-bit address space.',
        ]);
    });

    it('rejects an impractically large repeating memory initializer', () => {
        const machine = createInitialMachineState();
        const result = prepareMipsArrays(machine, [
            array({ length: '100001', valuePattern: '1' }),
        ]);

        expect(result.machine).toBe(machine);
        expect(result.errors).toEqual([
            'Array A: repeating values can initialize at most 100,000 elements.',
        ]);
    });

    it('does nothing when no arrays were added', () => {
        const machine = createInitialMachineState();
        const result = prepareMipsArrays(machine, []);

        expect(result).toEqual({ machine, definitions: [], errors: [] });
    });

    it('stores a high unsigned address as the same 32-bit register pattern', () => {
        const result = prepareMipsArrays(createInitialMachineState(), [
            array({ baseAddress: 'FFFFFFFC', length: '1' }),
        ]);

        expect(result.errors).toEqual([]);
        expect(readRegister(result.machine, 16)).toBe(-4);
        expect(result.definitions[0].baseAddress).toBe(0xfffffffc);
    });

    it('allows arrays with the same length to share a length register', () => {
        const result = prepareMipsArrays(createInitialMachineState(), [
            array(),
            array({
                name: 'B',
                baseAddress: '200',
                baseAddressRegister: 18,
                lengthRegister: 17,
            }),
        ]);

        expect(result.errors).toEqual([]);
        expect(readRegister(result.machine, 17)).toBe(8);
        expect(result.definitions).toHaveLength(2);
    });

    it('resolves length from the immediately previous array', () => {
        const result = prepareMipsArrays(createInitialMachineState(), [
            array({ length: '6' }),
            array({
                name: 'B',
                baseAddress: '200',
                length: '4',
                baseAddressRegister: 18,
                lengthRegister: 19,
            }),
            array({
                name: 'C',
                baseAddress: '300',
                lengthMode: 'same-as-previous',
                length: 'not used',
                baseAddressRegister: 20,
                lengthRegister: 19,
            }),
        ]);

        expect(result.errors).toEqual([]);
        expect(result.definitions[2].length).toBe(4);
        expect(readRegister(result.machine, 19)).toBe(4);
    });

    it('places an array immediately after the previous array', () => {
        const result = prepareMipsArrays(createInitialMachineState(), [
            array(),
            array({
                name: 'B',
                addressMode: 'after-previous',
                baseAddress: 'not used',
                baseAddressRegister: 18,
                lengthRegister: 17,
            }),
        ]);

        expect(result.errors).toEqual([]);
        expect(result.definitions[1]).toEqual({
            name: 'B',
            baseAddress: 0x120,
            length: 8,
            elementSizeBytes: 4,
        });
        expect(readRegister(result.machine, 18)).toBe(0x120);
    });

    it('chains automatic array addresses in definition order', () => {
        const result = prepareMipsArrays(createInitialMachineState(), [
            array({ length: '2' }),
            array({
                name: 'B',
                addressMode: 'after-previous',
                length: '3',
                baseAddressRegister: 18,
                lengthRegister: 19,
            }),
            array({
                name: 'C',
                addressMode: 'after-previous',
                length: '4',
                baseAddressRegister: 20,
                lengthRegister: 21,
            }),
        ]);

        expect(result.errors).toEqual([]);
        expect(
            result.definitions.map(({ name, baseAddress }) => ({
                name,
                baseAddress,
            })),
        ).toEqual([
            { name: 'A', baseAddress: 0x100 },
            { name: 'B', baseAddress: 0x108 },
            { name: 'C', baseAddress: 0x114 },
        ]);
        expect(readRegister(result.machine, 18)).toBe(0x108);
        expect(readRegister(result.machine, 20)).toBe(0x114);
    });

    it('rejects automatic placement without a previous array', () => {
        const machine = createInitialMachineState();
        const result = prepareMipsArrays(machine, [
            array({ addressMode: 'after-previous' }),
        ]);

        expect(result.machine).toBe(machine);
        expect(result.definitions).toEqual([]);
        expect(result.errors).toEqual([
            'Array A: there is no previous array to follow.',
        ]);
    });

    it('rejects an automatic address beyond the 32-bit address space', () => {
        const machine = createInitialMachineState();
        const result = prepareMipsArrays(machine, [
            array({ baseAddress: 'FFFFFFFC', length: '1' }),
            array({
                name: 'B',
                addressMode: 'after-previous',
                length: '1',
                baseAddressRegister: 18,
                lengthRegister: 17,
            }),
        ]);

        expect(result.machine).toBe(machine);
        expect(result.definitions).toEqual([]);
        expect(result.errors).toEqual([
            'Array B: address after A exceeds the 32-bit address space.',
        ]);
    });

    it('rejects a shared length register when the lengths differ', () => {
        const result = prepareMipsArrays(createInitialMachineState(), [
            array(),
            array({
                name: 'B',
                baseAddress: '200',
                length: '4',
                baseAddressRegister: 18,
                lengthRegister: 17,
            }),
        ]);

        expect(result.errors).toEqual([
            'Array B length cannot share its register with Array A length because their values differ.',
        ]);
    });

    it('rejects zero registers and invalid lengths', () => {
        const machine = createInitialMachineState();
        const result = prepareMipsArrays(machine, [
            array({ baseAddressRegister: 0, length: '0' }),
            array({
                name: 'B',
                baseAddress: '200',
                baseAddressRegister: 18,
                lengthRegister: 17,
            }),
        ]);

        expect(result.machine).toBe(machine);
        expect(result.definitions).toEqual([]);
        expect(result.errors).toEqual([
            'Array A: enter a positive length.',
            'Array A base address cannot use $zero.',
        ]);
    });
});
