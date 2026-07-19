import { describe, expect, it } from 'vitest';
import type { CacheAccess, CacheConfig, CacheLayout } from '../../types/cache';
import { validateCacheConfig } from './config';
import { createInitialCacheState, simulateCache } from './simulator';

const directMappedConfig: CacheConfig = {
    addressBits: 32,
    wordSizeBytes: 4,
    capacityBytes: 16,
    blockSizeBytes: 4,
    wayCount: 1,
};

function getLayout(config: CacheConfig): CacheLayout {
    const result = validateCacheConfig(config);
    if (!result.valid) {
        throw new Error(result.errors.join(' '));
    }
    return result.layout;
}

function access(ordinal: number, address: number): CacheAccess {
    return {
        ordinal,
        operation: 'read',
        address,
    };
}

describe('createInitialCacheState', () => {
    it('creates the configured number of empty sets and ways', () => {
        const config: CacheConfig = {
            ...directMappedConfig,
            capacityBytes: 32,
            wayCount: 4,
        };
        const state = createInitialCacheState(config, getLayout(config));

        expect(state.sets).toHaveLength(2);
        expect(state.sets[0].ways).toHaveLength(4);

        for (const set of state.sets) {
            for (const line of set.ways) {
                expect(line).toEqual({
                    valid: false,
                    tag: null,
                    blockNumber: null,
                    lastAccessedAtStep: null,
                });
            }
        }

        expect(state.sets[0].ways[0]).not.toBe(state.sets[0].ways[1]);
        expect(state.sets[0].ways[0]).not.toBe(state.sets[1].ways[0]);
    });
});

describe('simulateCache', () => {
    it('simulates direct-mapped hits, misses, and evictions', () => {
        const result = simulateCache(directMappedConfig, [
            access(0, 0x00),
            access(1, 0x00),
            access(2, 0x10),
            access(3, 0x00),
        ]);

        expect(result.steps.map((step) => step.hit)).toEqual([
            false,
            true,
            false,
            false,
        ]);
        expect(result.steps.map((step) => step.wayIndex)).toEqual([0, 0, 0, 0]);
        expect(result.steps[0].evictedLine).toBeNull();
        expect(result.steps[2].evictedLine).toEqual({
            valid: true,
            tag: 0,
            blockNumber: 0,
            lastAccessedAtStep: 1,
        });
        expect(result.steps[3].evictedLine?.blockNumber).toBe(4);
        expect(result.hitCount).toBe(1);
        expect(result.missCount).toBe(3);
        expect(
            result.steps.at(-1)?.stateAfter.sets[0].ways[0].blockNumber,
        ).toBe(0);
    });

    it('hits on later words that belong to an already loaded block', () => {
        const config: CacheConfig = {
            ...directMappedConfig,
            capacityBytes: 64,
            blockSizeBytes: 16,
        };
        const result = simulateCache(config, [
            access(0, 0x00),
            access(1, 0x04),
            access(2, 0x08),
            access(3, 0x0c),
            access(4, 0x10),
        ]);

        expect(result.steps.map((step) => step.hit)).toEqual([
            false,
            true,
            true,
            true,
            false,
        ]);
        expect(result.hitCount).toBe(3);
        expect(result.missCount).toBe(2);
    });

    it('updates recency on a hit and evicts the LRU way in a 2-way set', () => {
        const config: CacheConfig = {
            ...directMappedConfig,
            wayCount: 2,
        };
        const result = simulateCache(config, [
            access(0, 0x00),
            access(1, 0x08),
            access(2, 0x00),
            access(3, 0x10),
            access(4, 0x08),
        ]);

        expect(result.steps.map((step) => step.hit)).toEqual([
            false,
            false,
            true,
            false,
            false,
        ]);
        expect(result.steps.slice(0, 4).map((step) => step.wayIndex)).toEqual([
            0, 1, 0, 1,
        ]);
        expect(result.steps[3].evictedLine?.blockNumber).toBe(2);
        expect(result.steps[3].evictedLine?.lastAccessedAtStep).toBe(1);
    });

    it('supports general associativity and LRU replacement in a 4-way set', () => {
        const config: CacheConfig = {
            ...directMappedConfig,
            capacityBytes: 32,
            wayCount: 4,
        };
        const result = simulateCache(config, [
            access(0, 0x00),
            access(1, 0x08),
            access(2, 0x10),
            access(3, 0x18),
            access(4, 0x00),
            access(5, 0x20),
        ]);

        expect(result.steps.map((step) => step.hit)).toEqual([
            false,
            false,
            false,
            false,
            true,
            false,
        ]);
        expect(result.steps.slice(0, 4).map((step) => step.wayIndex)).toEqual([
            0, 1, 2, 3,
        ]);
        expect(result.steps[5].wayIndex).toBe(1);
        expect(result.steps[5].evictedLine?.blockNumber).toBe(2);
    });

    it('keeps earlier cache snapshots unchanged', () => {
        const result = simulateCache(directMappedConfig, [
            access(0, 0x00),
            access(1, 0x00),
            access(2, 0x10),
        ]);

        expect(result.initialState.sets[0].ways[0].valid).toBe(false);
        expect(result.steps[0].stateAfter.sets[0].ways[0]).toMatchObject({
            blockNumber: 0,
            lastAccessedAtStep: 0,
        });
        expect(result.steps[1].stateAfter.sets[0].ways[0]).toMatchObject({
            blockNumber: 0,
            lastAccessedAtStep: 1,
        });
        expect(
            result.steps.at(-1)?.stateAfter.sets[0].ways[0].blockNumber,
        ).toBe(4);
    });

    it('rejects invalid access addresses', () => {
        expect(() =>
            simulateCache(directMappedConfig, [access(0, 0x02)]),
        ).toThrow('Address must be aligned to word size');
    });

    it('returns an empty cold simulation for an empty trace', () => {
        const result = simulateCache(directMappedConfig, []);

        expect(result.steps).toEqual([]);
        expect(result.hitCount).toBe(0);
        expect(result.missCount).toBe(0);
        expect(result.initialState.sets[0].ways[0].valid).toBe(false);
    });
});
