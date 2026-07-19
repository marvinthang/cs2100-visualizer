import { describe, expect, it } from 'vitest';
import type { CacheAccess, CacheConfig } from '../../types/cache';
import { analyzeCacheSimulation, summarizeCacheAnalysis } from './analysis';

const twoLineDirectMappedConfig: CacheConfig = {
    addressBits: 32,
    wordSizeBytes: 4,
    capacityBytes: 8,
    blockSizeBytes: 4,
    wayCount: 1,
};

const multiwordBlockConfig: CacheConfig = {
    ...twoLineDirectMappedConfig,
    capacityBytes: 64,
    blockSizeBytes: 16,
};

function access(ordinal: number, address: number): CacheAccess {
    return {
        ordinal,
        operation: 'read',
        address,
    };
}

describe('analyzeCacheSimulation', () => {
    it('classifies the first access to each block as compulsory', () => {
        const analysis = analyzeCacheSimulation(twoLineDirectMappedConfig, [
            access(0, 0x00),
            access(1, 0x04),
        ]);

        expect(analysis.steps.map((step) => step.missType)).toEqual([
            'compulsory',
            'compulsory',
        ]);
        expect(analysis.steps.map((step) => step.locality)).toEqual([
            null,
            null,
        ]);
    });

    it('classifies a different word in an existing block as spatial', () => {
        const analysis = analyzeCacheSimulation(multiwordBlockConfig, [
            access(0, 0x00),
            access(1, 0x04),
        ]);

        expect(analysis.simulation.steps[1].hit).toBe(true);
        expect(analysis.steps[1]).toEqual({
            missType: null,
            locality: 'spatial',
            relatedStep: 0,
        });
    });

    it('classifies exact-address reuse as temporal', () => {
        const analysis = analyzeCacheSimulation(multiwordBlockConfig, [
            access(0, 0x00),
            access(1, 0x04),
            access(2, 0x00),
        ]);

        expect(analysis.steps[2]).toEqual({
            missType: null,
            locality: 'temporal',
            relatedStep: 0,
        });
    });

    it('does not treat nearby addresses in different blocks as spatial', () => {
        const analysis = analyzeCacheSimulation(multiwordBlockConfig, [
            access(0, 0x0c),
            access(1, 0x10),
        ]);

        expect(analysis.steps[1]).toEqual({
            missType: 'compulsory',
            locality: null,
            relatedStep: null,
        });
    });

    it('classifies a mapping collision as a conflict miss', () => {
        const analysis = analyzeCacheSimulation(twoLineDirectMappedConfig, [
            access(0, 0x00),
            access(1, 0x08),
            access(2, 0x00),
        ]);

        expect(analysis.simulation.steps.map((step) => step.hit)).toEqual([
            false,
            false,
            false,
        ]);
        expect(analysis.steps.map((step) => step.missType)).toEqual([
            'compulsory',
            'compulsory',
            'conflict',
        ]);
        expect(analysis.steps[2]).toEqual({
            missType: 'conflict',
            locality: 'temporal',
            relatedStep: 0,
        });
    });

    it('classifies a miss from an oversized working set as capacity', () => {
        const analysis = analyzeCacheSimulation(twoLineDirectMappedConfig, [
            access(0, 0x00),
            access(1, 0x04),
            access(2, 0x08),
            access(3, 0x00),
        ]);

        expect(analysis.steps.map((step) => step.missType)).toEqual([
            'compulsory',
            'compulsory',
            'compulsory',
            'capacity',
        ]);
        expect(analysis.steps[3]).toEqual({
            missType: 'capacity',
            locality: 'temporal',
            relatedStep: 0,
        });
    });

    it('leaves miss type empty for a cache hit', () => {
        const analysis = analyzeCacheSimulation(twoLineDirectMappedConfig, [
            access(0, 0x00),
            access(1, 0x00),
        ]);

        expect(analysis.simulation.steps[1].hit).toBe(true);
        expect(analysis.steps[1].missType).toBeNull();
    });

    it('returns no step analyses for an empty trace', () => {
        const analysis = analyzeCacheSimulation(twoLineDirectMappedConfig, []);

        expect(analysis.steps).toEqual([]);
        expect(analysis.simulation.hitCount).toBe(0);
        expect(analysis.simulation.missCount).toBe(0);
    });
});

function summarize(config: CacheConfig, addresses: number[]) {
    const accesses = addresses.map((address, ordinal) =>
        access(ordinal, address),
    );
    return summarizeCacheAnalysis(analyzeCacheSimulation(config, accesses));
}

describe('summarizeCacheAnalysis', () => {
    it('returns zero counts and a null rate for an empty trace', () => {
        expect(summarize(twoLineDirectMappedConfig, [])).toEqual({
            accessCount: 0,
            hitCount: 0,
            missCount: 0,
            hitRate: null,
        });
    });

    it('calculates the hit rate', () => {
        expect(summarize(multiwordBlockConfig, [0x00, 0x04, 0x00])).toEqual({
            accessCount: 3,
            hitCount: 2,
            missCount: 1,
            hitRate: 2 / 3,
        });
    });
});
