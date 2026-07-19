import { describe, expect, it } from 'vitest';
import { validateCacheConfig } from './config';
import type { CacheConfig } from '../../types/cache';

describe('canValidateCacheConfig', () => {
    it('accepts valid 1-way associative cache configurations', () => {
        const config: CacheConfig = {
            addressBits: 32,
            wordSizeBytes: 4,
            capacityBytes: 64,
            blockSizeBytes: 16,
            wayCount: 1,
        };

        const result = validateCacheConfig(config);

        expect(result).toEqual({
            valid: true,
            layout: {
                lineCount: 4,
                setCount: 4,
                wordCountPerBlock: 4,
                byteOffsetBits: 2,
                blockOffsetBits: 2,
                setIndexBits: 2,
                tagBits: 26,
            },
        });
    });

    it('accepts valid 2-way associative cache configurations', () => {
        const config: CacheConfig = {
            addressBits: 32,
            wordSizeBytes: 4,
            capacityBytes: 64,
            blockSizeBytes: 16,
            wayCount: 2,
        };

        const result = validateCacheConfig(config);

        expect(result).toEqual({
            valid: true,
            layout: {
                lineCount: 4,
                setCount: 2,
                wordCountPerBlock: 4,
                byteOffsetBits: 2,
                blockOffsetBits: 2,
                setIndexBits: 1,
                tagBits: 27,
            },
        });
    });

    it('rejects invalid cache configurations', () => {
        const config: CacheConfig = {
            addressBits: 32,
            wordSizeBytes: 4,
            capacityBytes: 60, // Not a power of two
            blockSizeBytes: 16,
            wayCount: 1,
        };

        const result = validateCacheConfig(config);

        expect(result).toEqual({
            valid: false,
            errors: ['Capacity must be a power of two.'],
        });
    });

    it('rejects invalid block size configurations', () => {
        const config: CacheConfig = {
            addressBits: 32,
            wordSizeBytes: 4,
            capacityBytes: 64,
            blockSizeBytes: 20, // Not a power of two
            wayCount: 1,
        };

        const result = validateCacheConfig(config);

        expect(result).toEqual({
            valid: false,
            errors: ['Block size must be a power of two.'],
        });
    });

    it('rejects capacity that is smaller than block size', () => {
        const config: CacheConfig = {
            addressBits: 32,
            wordSizeBytes: 4,
            capacityBytes: 64,
            blockSizeBytes: 128, // Larger than capacity
            wayCount: 1,
        };

        const result = validateCacheConfig(config);

        expect(result).toEqual({
            valid: false,
            errors: ['Capacity must be greater than or equal to block size.'],
        });
    });

    it('rejects block size that is smaller than word size', () => {
        const config: CacheConfig = {
            addressBits: 32,
            wordSizeBytes: 4,
            capacityBytes: 64,
            blockSizeBytes: 2, // Smaller than word size
            wayCount: 1,
        };

        const result = validateCacheConfig(config);

        expect(result).toEqual({
            valid: false,
            errors: ['Block size must be greater than or equal to word size.'],
        });
    });

    it('rejects invalid way count configurations', () => {
        const config: CacheConfig = {
            addressBits: 32,
            wordSizeBytes: 4,
            capacityBytes: 64,
            blockSizeBytes: 16,
            wayCount: 8, // Invalid way count for this configuration
        };

        const result = validateCacheConfig(config);

        expect(result).toEqual({
            valid: false,
            errors: ['Invalid way count.'],
        });
    });
});
