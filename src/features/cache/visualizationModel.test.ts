import { describe, expect, it } from 'vitest';
import { simulateCache } from '../../core/cache/simulator';
import type { CacheConfig, CacheLine } from '../../types/cache';
import type { MemoryArrayDefinition } from '../../types/memory';
import {
    buildVisibleCacheRows,
    getArrayCacheStats,
    getCacheLineWordAddresses,
    getDisplayLruWay,
    getInstructionWordLabel,
} from './visualizationModel';

const config: CacheConfig = {
    addressBits: 32,
    wordSizeBytes: 4,
    capacityBytes: 32,
    blockSizeBytes: 16,
    wayCount: 2,
};

describe('getCacheLineWordAddresses', () => {
    it('returns every word address contained in a valid cache block', () => {
        const line: CacheLine = {
            valid: true,
            tag: 1,
            blockNumber: 3,
            lastAccessedAtStep: 2,
        };

        expect(getCacheLineWordAddresses(line, config)).toEqual([
            48, 52, 56, 60,
        ]);
    });

    it('returns no word addresses for an invalid line', () => {
        const line: CacheLine = {
            valid: false,
            tag: null,
            blockNumber: null,
            lastAccessedAtStep: null,
        };

        expect(getCacheLineWordAddresses(line, config)).toEqual([]);
    });
});

describe('getArrayCacheStats', () => {
    it('counts hits and misses for each array address range', () => {
        const arrays: MemoryArrayDefinition[] = [
            {
                name: 'A',
                baseAddress: 0x100,
                length: 4,
                elementSizeBytes: 4,
            },
            {
                name: 'B',
                baseAddress: 0x200,
                length: 2,
                elementSizeBytes: 4,
            },
            {
                name: 'C',
                baseAddress: 0x300,
                length: 1,
                elementSizeBytes: 4,
            },
        ];
        const simulation = simulateCache(config, [
            { ordinal: 0, operation: 'read', address: 0x100 },
            { ordinal: 1, operation: 'read', address: 0x104 },
            { ordinal: 2, operation: 'read', address: 0x200 },
            { ordinal: 3, operation: 'write', address: 0x200 },
            { ordinal: 4, operation: 'read', address: 0x400 },
        ]);

        expect(getArrayCacheStats(simulation.steps, arrays)).toEqual([
            { name: 'A', accessCount: 2, hitCount: 1, missCount: 1 },
            { name: 'B', accessCount: 2, hitCount: 1, missCount: 1 },
            { name: 'C', accessCount: 0, hitCount: 0, missCount: 0 },
        ]);
    });
});

describe('buildVisibleCacheRows', () => {
    it('shows every set when the cache is small', () => {
        expect(buildVisibleCacheRows(4, 2)).toEqual([
            { kind: 'set', setIndex: 0 },
            { kind: 'set', setIndex: 1 },
            { kind: 'set', setIndex: 2 },
            { kind: 'set', setIndex: 3 },
        ]);
    });

    it('keeps edge and active sets while collapsing large gaps', () => {
        expect(buildVisibleCacheRows(20, 10)).toEqual([
            { kind: 'set', setIndex: 0 },
            { kind: 'set', setIndex: 1 },
            { kind: 'gap', from: 2, to: 7 },
            { kind: 'set', setIndex: 8 },
            { kind: 'set', setIndex: 9 },
            { kind: 'set', setIndex: 10 },
            { kind: 'set', setIndex: 11 },
            { kind: 'set', setIndex: 12 },
            { kind: 'gap', from: 13, to: 17 },
            { kind: 'set', setIndex: 18 },
            { kind: 'set', setIndex: 19 },
        ]);
    });

    it('does not insert a gap between overlapping edge and active windows', () => {
        expect(buildVisibleCacheRows(13, 1)).toEqual([
            { kind: 'set', setIndex: 0 },
            { kind: 'set', setIndex: 1 },
            { kind: 'set', setIndex: 2 },
            { kind: 'set', setIndex: 3 },
            { kind: 'gap', from: 4, to: 10 },
            { kind: 'set', setIndex: 11 },
            { kind: 'set', setIndex: 12 },
        ]);
    });
});

describe('getDisplayLruWay', () => {
    const validLine = (lastAccessedAtStep: number): CacheLine => ({
        valid: true,
        tag: 0,
        blockNumber: 0,
        lastAccessedAtStep,
    });

    it('selects the least recently accessed valid way', () => {
        expect(
            getDisplayLruWay([validLine(8), validLine(3), validLine(5)]),
        ).toBe(1);
    });

    it('hides the LRU marker until every associative way is valid', () => {
        expect(
            getDisplayLruWay([
                validLine(2),
                {
                    valid: false,
                    tag: null,
                    blockNumber: null,
                    lastAccessedAtStep: null,
                },
            ]),
        ).toBeNull();
    });

    it('does not show an LRU marker for a direct-mapped set', () => {
        expect(getDisplayLruWay([validLine(2)])).toBeNull();
    });
});

describe('getInstructionWordLabel', () => {
    const layout = {
        baseAddress: 0x00400000,
        instructionCount: 3,
    };

    it('numbers aligned words from the instruction base address', () => {
        expect(getInstructionWordLabel(0x00400000, layout)).toBe('I1');
        expect(getInstructionWordLabel(0x00400008, layout)).toBe('I3');
    });

    it('does not label addresses outside the program or between words', () => {
        expect(getInstructionWordLabel(0x003ffffc, layout)).toBeNull();
        expect(getInstructionWordLabel(0x00400002, layout)).toBeNull();
        expect(getInstructionWordLabel(0x0040000c, layout)).toBeNull();
        expect(getInstructionWordLabel(0x00400000, null)).toBeNull();
    });
});
