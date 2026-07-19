import { describe, expect, it } from 'vitest';
import { parseAddressTrace } from './addressTrace';

describe('parseAddressTrace', () => {
    it('parses hexadecimal addresses separated by spaces, commas, or lines', () => {
        const result = parseAddressTrace('0 4, 0x8\nC', 'hexadecimal');

        expect(result.errors).toEqual([]);
        expect(result.accesses.map((access) => access.address)).toEqual([
            0x0, 0x4, 0x8, 0xc,
        ]);
    });

    it('parses decimal addresses without guessing their base', () => {
        const result = parseAddressTrace('0 4 8 12', 'decimal');

        expect(result.errors).toEqual([]);
        expect(result.accesses.map((access) => access.address)).toEqual([
            0, 4, 8, 12,
        ]);
    });

    it('interprets the same text according to the selected format', () => {
        const decimal = parseAddressTrace('100', 'decimal');
        const hexadecimal = parseAddressTrace('100', 'hexadecimal');

        expect(decimal.accesses[0].address).toBe(100);
        expect(hexadecimal.accesses[0].address).toBe(0x100);
    });

    it('creates ordered accesses', () => {
        const result = parseAddressTrace('0 4', 'hexadecimal');

        expect(result.accesses).toEqual([
            {
                ordinal: 0,
                operation: 'read',
                address: 0,
            },
            {
                ordinal: 1,
                operation: 'read',
                address: 4,
            },
        ]);
    });

    it('returns an empty result for empty input', () => {
        expect(parseAddressTrace(' \n, ', 'hexadecimal')).toEqual({
            accesses: [],
            errors: [],
        });
    });

    it('rejects hexadecimal syntax in decimal mode', () => {
        const result = parseAddressTrace('16 0x20', 'decimal');

        expect(result.accesses.map((access) => access.address)).toEqual([16]);
        expect(result.errors).toEqual([
            'Item 2: "0x20" is not a valid decimal address.',
        ]);
    });

    it('rejects invalid hexadecimal digits', () => {
        const result = parseAddressTrace('10 2G', 'hexadecimal');

        expect(result.accesses.map((access) => access.address)).toEqual([0x10]);
        expect(result.errors).toEqual([
            'Item 2: "2G" is not a valid hexadecimal address.',
        ]);
    });

    it('collects syntax, alignment, and range errors together', () => {
        const result = parseAddressTrace('2 0x10 nope 4294967296 4', 'decimal');

        expect(result.accesses).toEqual([
            {
                ordinal: 0,
                operation: 'read',
                address: 4,
            },
        ]);
        expect(result.errors).toEqual([
            'Item 1: "2" is invalid: Address must be aligned to word size.',
            'Item 2: "0x10" is not a valid decimal address.',
            'Item 3: "nope" is not a valid decimal address.',
            'Item 4: "4294967296" is invalid: Address is out of bounds.',
        ]);
    });

    it('accepts the largest aligned 32-bit hexadecimal address', () => {
        const result = parseAddressTrace('0xFFFFFFFC', 'hexadecimal');

        expect(result.errors).toEqual([]);
        expect(result.accesses[0].address).toBe(0xfffffffc);
    });
});
