import { describe, expect, it } from 'vitest';
import type { MemoryArrayDefinition } from '../../types/memory';
import {
    calculateArrayDraftBaseAddress,
    parseArrayDraftLength,
    validateArrayDefinitions,
} from './array';

function array(
    addressMode: 'fixed' | 'after-previous',
    baseAddress: string,
    length: string,
) {
    return {
        addressMode,
        baseAddress,
        lengthMode: 'fixed' as const,
        length,
    };
}

describe('array memory helpers', () => {
    it('places an array after the previous array', () => {
        const arrays = [
            array('fixed', '100', '8'),
            array('after-previous', '200', '4'),
        ];

        expect(calculateArrayDraftBaseAddress(arrays, 1, 'hexadecimal')).toBe(
            0x120,
        );
    });

    it('chains automatic addresses through multiple arrays', () => {
        const arrays = [
            array('fixed', '256', '4'),
            array('after-previous', '', '3'),
            array('after-previous', '', '2'),
        ];

        expect(calculateArrayDraftBaseAddress(arrays, 1, 'decimal')).toBe(272);
        expect(calculateArrayDraftBaseAddress(arrays, 2, 'decimal')).toBe(284);
    });

    it('recalculates when the previous base or length changes', () => {
        const arrays = [
            array('fixed', '100', '8'),
            array('after-previous', '', '4'),
        ];

        expect(calculateArrayDraftBaseAddress(arrays, 1, 'hexadecimal')).toBe(
            0x120,
        );

        arrays[0].baseAddress = '200';
        arrays[0].length = '4';

        expect(calculateArrayDraftBaseAddress(arrays, 1, 'hexadecimal')).toBe(
            0x210,
        );
    });

    it('rejects automatic placement without a usable previous array', () => {
        expect(
            calculateArrayDraftBaseAddress(
                [array('after-previous', '', '4')],
                0,
                'hexadecimal',
            ),
        ).toBeNull();
        expect(
            calculateArrayDraftBaseAddress(
                [array('fixed', '100', '0'), array('after-previous', '', '4')],
                1,
                'hexadecimal',
            ),
        ).toBeNull();
    });

    it('rejects an automatic address outside the 32-bit range', () => {
        const arrays = [
            array('fixed', 'FFFFFFFC', '1'),
            array('after-previous', '', '1'),
        ];

        expect(calculateArrayDraftBaseAddress(arrays, 1, 'hexadecimal')).toBe(
            null,
        );
    });

    it('uses the immediately previous array length', () => {
        const arrays = [
            array('fixed', '100', '8'),
            array('after-previous', '', '3'),
            {
                ...array('after-previous', '', '1'),
                lengthMode: 'same-as-previous' as const,
            },
        ];

        expect(parseArrayDraftLength(arrays, 2)).toBe(3);
    });

    it('rejects a length outside JavaScript safe integers', () => {
        expect(
            parseArrayDraftLength(
                [array('fixed', '100', '9007199254740992')],
                0,
            ),
        ).toBeNull();
    });
});

function definition(
    name: string,
    baseAddress: number,
    length: number,
): MemoryArrayDefinition {
    return { name, baseAddress, length, elementSizeBytes: 4 };
}

describe('validateArrayDefinitions', () => {
    it('accepts adjacent arrays', () => {
        expect(
            validateArrayDefinitions([
                definition('A', 0x100, 4),
                definition('B', 0x110, 2),
            ]),
        ).toEqual([]);
    });

    it('rejects overlapping arrays', () => {
        expect(
            validateArrayDefinitions([
                definition('A', 0x100, 4),
                definition('B', 0x108, 2),
            ]),
        ).toEqual(['Array "B" overlaps with array "A".']);
    });

    it('rejects an array whose final byte exceeds 32-bit memory', () => {
        expect(
            validateArrayDefinitions([definition('A', 0xfffffffc, 2)]),
        ).toEqual(['Array "A" extends beyond the 32-bit address space.']);
    });

    it('rejects unsafe integer lengths before calculating an extent', () => {
        expect(
            validateArrayDefinitions([
                definition('A', 0x100, Number.MAX_SAFE_INTEGER + 1),
            ]),
        ).toEqual(['Length for array "A" must be a positive integer.']);
    });
});
