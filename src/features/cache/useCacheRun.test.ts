import { describe, expect, it } from 'vitest';
import { MAX_CACHE_ACCESSES } from '../../core/cache/simulator';
import type { CacheAccess, CacheConfig } from '../../types/cache';
import { buildCacheRun, type CacheRunContext } from './useCacheRun';

const config: CacheConfig = {
    addressBits: 32,
    wordSizeBytes: 4,
    capacityBytes: 16,
    blockSizeBytes: 8,
    wayCount: 1,
};

const context: CacheRunContext = {
    sourceMode: 'array',
    addressFormat: 'decimal',
    arrayDefinitions: [
        {
            name: 'A',
            baseAddress: 256,
            length: 4,
            elementSizeBytes: 4,
        },
    ],
    mipsTrace: null,
    mipsAccessMode: null,
};

describe('buildCacheRun', () => {
    it('attaches one metadata snapshot to a successful analysis', () => {
        const accesses: CacheAccess[] = [
            { ordinal: 0, operation: 'read', address: 256 },
        ];

        const result = buildCacheRun(config, accesses, context);

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.run.sourceMode).toBe('array');
        expect(result.run.addressFormat).toBe('decimal');
        expect(result.run.arrayDefinitions).toBe(context.arrayDefinitions);
        expect(result.run.analysis.simulation.steps).toHaveLength(1);
    });

    it('returns no partial run when cache geometry is invalid', () => {
        const result = buildCacheRun(
            { ...config, capacityBytes: 12 },
            [],
            context,
        );

        expect(result).toEqual({
            ok: false,
            error: 'Invalid cache configuration: Capacity must be a power of two.',
        });
        expect('run' in result).toBe(false);
    });

    it('rejects an oversized trace before allocating simulation states', () => {
        const accesses = Array.from(
            { length: MAX_CACHE_ACCESSES + 1 },
            (_, ordinal): CacheAccess => ({
                ordinal,
                operation: 'read',
                address: 0,
            }),
        );

        expect(buildCacheRun(config, accesses, context)).toEqual({
            ok: false,
            error: 'A cache trace can contain at most 50,000 accesses.',
        });
    });
});
