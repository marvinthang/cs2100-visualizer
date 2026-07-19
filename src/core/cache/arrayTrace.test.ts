import { describe, expect, it } from 'vitest';
import type { CacheArrayLoop, CacheArrayPattern } from '../../types/cache';
import type { MemoryArrayDefinition } from '../../types/memory';
import { generateArrayTrace, getArrayElementLabel } from './arrayTrace';

const defaultLoop: CacheArrayLoop = {
    startIndex: 0,
    endExclusiveIndex: 4,
    stride: 1,
};

function array(
    name: string,
    baseAddress: number,
    length: number,
): MemoryArrayDefinition {
    return {
        name,
        baseAddress,
        length,
        elementSizeBytes: 4,
    };
}

function pattern(
    arrayName: string,
    multiplier = 1,
    offset = 0,
): CacheArrayPattern {
    return { arrayName, multiplier, offset };
}

describe('generateArrayTrace', () => {
    it('generates sequential addresses and labels for A[i]', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 4)],
            [pattern('A')],
            defaultLoop,
        );

        expect(result.errors).toEqual([]);
        expect(result.accesses).toEqual([
            {
                ordinal: 0,
                operation: 'read',
                address: 0x100,
                label: 'A[0]',
            },
            {
                ordinal: 1,
                operation: 'read',
                address: 0x104,
                label: 'A[1]',
            },
            {
                ordinal: 2,
                operation: 'read',
                address: 0x108,
                label: 'A[2]',
            },
            {
                ordinal: 3,
                operation: 'read',
                address: 0x10c,
                label: 'A[3]',
            },
        ]);
    });

    it('preserves pattern order across multiple arrays', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 4), array('B', 0x200, 4)],
            [pattern('A'), pattern('B', 2)],
            { startIndex: 0, endExclusiveIndex: 2, stride: 1 },
        );

        expect(result.errors).toEqual([]);
        expect(
            result.accesses.map(({ label, address }) => ({ label, address })),
        ).toEqual([
            { label: 'A[0]', address: 0x100 },
            { label: 'B[0]', address: 0x200 },
            { label: 'A[1]', address: 0x104 },
            { label: 'B[2]', address: 0x208 },
        ]);
    });

    it('applies multiplier, offset, and loop stride', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 8)],
            [pattern('A', 1, 1)],
            { startIndex: 0, endExclusiveIndex: 5, stride: 2 },
        );

        expect(result.errors).toEqual([]);
        expect(result.accesses.map((access) => access.label)).toEqual([
            'A[1]',
            'A[3]',
            'A[5]',
        ]);
        expect(result.accesses.map((access) => access.address)).toEqual([
            0x104, 0x10c, 0x114,
        ]);
    });

    it('reports a pattern that references an unknown array', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 4)],
            [pattern('B')],
            { startIndex: 0, endExclusiveIndex: 1, stride: 1 },
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toEqual(['Array definition for "B" not found.']);
    });

    it('skips generated indices outside the selected array', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 2)],
            [pattern('A')],
            { startIndex: 0, endExclusiveIndex: 3, stride: 1 },
        );

        expect(result.errors).toEqual([]);
        expect(result.accesses.map((access) => access.label)).toEqual([
            'A[0]',
            'A[1]',
        ]);
    });

    it('rejects invalid array definitions before generating accesses', () => {
        const result = generateArrayTrace(
            [array('A', -4, 0)],
            [pattern('A')],
            defaultLoop,
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toEqual([
            'Base address for array "A" must be non-negative.',
        ]);
    });

    it('rejects an array with no elements', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 0)],
            [pattern('A')],
            defaultLoop,
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toEqual([
            'Length for array "A" must be positive.',
        ]);
    });

    it.each([
        {
            loop: { startIndex: 0, endExclusiveIndex: 4, stride: 0 },
            error: 'Loop stride must be positive.',
        },
        {
            loop: { startIndex: 4, endExclusiveIndex: 4, stride: 1 },
            error: 'Loop start index (4) must be less than end index (4).',
        },
    ])('rejects an invalid loop: $error', ({ loop, error }) => {
        const result = generateArrayTrace(
            [array('A', 0x100, 4)],
            [pattern('A')],
            loop,
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toContain(error);
    });

    it('rejects a base address that is not word-aligned', () => {
        const result = generateArrayTrace(
            [array('A', 0x102, 4)],
            [pattern('A')],
            defaultLoop,
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toEqual([
            'Base address for array "A" must be aligned to 4 bytes.',
        ]);
    });

    it('rejects duplicate array names', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 4), array('A', 0x200, 4)],
            [pattern('A')],
            defaultLoop,
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toEqual(['Array name "A" must be unique.']);
    });

    it('rejects an empty access pattern', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 4)],
            [],
            defaultLoop,
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toEqual([
            'At least one array access pattern is required.',
        ]);
    });

    it('rejects generated addresses outside the 32-bit address range', () => {
        const result = generateArrayTrace(
            [array('A', 0xfffffffc, 2)],
            [pattern('A', 1, 1)],
            { startIndex: 0, endExclusiveIndex: 1, stride: 1 },
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toEqual([
            'Array "A" extends beyond the 32-bit address space.',
        ]);
    });

    it('stops before an array trace grows beyond the access limit', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 4)],
            [pattern('A'), pattern('A')],
            { startIndex: 0, endExclusiveIndex: 3, stride: 1 },
            3,
        );

        expect(result.accesses).toHaveLength(3);
        expect(result.errors).toEqual([
            'A cache trace can contain at most 3 accesses.',
        ]);
    });

    it('rejects a loop with too many iterations even if accesses are out of bounds', () => {
        const result = generateArrayTrace(
            [array('A', 0x100, 1)],
            [pattern('A')],
            { startIndex: 0, endExclusiveIndex: 4, stride: 1 },
            3,
        );

        expect(result.accesses).toEqual([]);
        expect(result.errors).toEqual([
            'An array loop can execute at most 3 iterations.',
        ]);
    });
});

describe('getArrayElementLabel', () => {
    const arrays = [array('A', 0x100, 4), array('B', 0x200, 2)];

    it('labels every aligned element address', () => {
        expect(getArrayElementLabel(0x100, arrays)).toBe('A[0]');
        expect(getArrayElementLabel(0x108, arrays)).toBe('A[2]');
        expect(getArrayElementLabel(0x204, arrays)).toBe('B[1]');
    });

    it('does not label addresses outside arrays or between elements', () => {
        expect(getArrayElementLabel(0x110, arrays)).toBeNull();
        expect(getArrayElementLabel(0x102, arrays)).toBeNull();
    });
});
