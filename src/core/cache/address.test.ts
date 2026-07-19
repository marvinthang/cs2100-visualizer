import { describe, expect, it } from 'vitest';
import type { CacheConfig, CacheLayout } from '../../types/cache';
import { decomposeAddress, validateCacheAddress } from './address';
import { validateCacheConfig } from './config';

const directMappedConfig: CacheConfig = {
    addressBits: 32,
    wordSizeBytes: 4,
    capacityBytes: 64,
    blockSizeBytes: 16,
    wayCount: 1,
};

function getLayout(config: CacheConfig): CacheLayout {
    const result = validateCacheConfig(config);
    if (!result.valid) {
        throw new Error(result.errors.join(' '));
    }
    return result.layout;
}

const directMappedLayout = getLayout(directMappedConfig);

describe('validateCacheAddress', () => {
    const addressBits = 32;
    const wordSizeBytes = 4;

    it('accepts a valid word-aligned address', () => {
        expect(
            validateCacheAddress(2304, addressBits, wordSizeBytes),
        ).toBeNull();
    });

    it('accepts address zero', () => {
        expect(validateCacheAddress(0, addressBits, wordSizeBytes)).toBeNull();
    });

    it('accepts the largest aligned 32-bit address', () => {
        expect(
            validateCacheAddress(0xfffffffc, addressBits, wordSizeBytes),
        ).toBeNull();
    });

    it('rejects a non-integer address', () => {
        expect(validateCacheAddress(12.5, addressBits, wordSizeBytes)).toBe(
            'Address must be an integer.',
        );
    });

    it('rejects an unsafe integer address', () => {
        expect(
            validateCacheAddress(
                Number.MAX_SAFE_INTEGER + 1,
                addressBits,
                wordSizeBytes,
            ),
        ).toBe('Address must be an integer.');
    });

    it('rejects a negative address', () => {
        expect(validateCacheAddress(-4, addressBits, wordSizeBytes)).toBe(
            'Address is out of bounds.',
        );
    });

    it('rejects an address equal to the address-space size', () => {
        expect(
            validateCacheAddress(2 ** addressBits, addressBits, wordSizeBytes),
        ).toBe('Address is out of bounds.');
    });

    it('rejects an address larger than the address-space size', () => {
        expect(
            validateCacheAddress(
                2 ** addressBits + 4,
                addressBits,
                wordSizeBytes,
            ),
        ).toBe('Address is out of bounds.');
    });

    it('rejects an address not aligned to the word size', () => {
        expect(validateCacheAddress(14, addressBits, wordSizeBytes)).toBe(
            'Address must be aligned to word size.',
        );
    });
});

describe('decomposeAddress', () => {
    it('decomposes an address into cache fields', () => {
        expect(
            decomposeAddress(224, directMappedConfig, directMappedLayout),
        ).toEqual({
            blockNumber: 14,
            blockOffset: 0,
            byteOffset: 0,
            setIndex: 2,
            tag: 3,
        });
    });

    it('separates word and byte offsets within a block', () => {
        expect(
            decomposeAddress(230, directMappedConfig, directMappedLayout),
        ).toEqual({
            blockNumber: 14,
            blockOffset: 1,
            byteOffset: 2,
            setIndex: 2,
            tag: 3,
        });
    });

    it('decomposes address zero', () => {
        expect(
            decomposeAddress(0, directMappedConfig, directMappedLayout),
        ).toEqual({
            blockNumber: 0,
            blockOffset: 0,
            byteOffset: 0,
            setIndex: 0,
            tag: 0,
        });
    });

    it('handles the final byte of a block', () => {
        expect(
            decomposeAddress(31, directMappedConfig, directMappedLayout),
        ).toEqual({
            blockNumber: 1,
            blockOffset: 3,
            byteOffset: 3,
            setIndex: 1,
            tag: 0,
        });
    });

    it('handles a fully associative cache with one set', () => {
        const fullyAssociativeConfig: CacheConfig = {
            ...directMappedConfig,
            wayCount: 4,
        };
        const fullyAssociativeLayout = getLayout(fullyAssociativeConfig);

        expect(
            decomposeAddress(
                230,
                fullyAssociativeConfig,
                fullyAssociativeLayout,
            ),
        ).toEqual({
            blockNumber: 14,
            blockOffset: 1,
            byteOffset: 2,
            setIndex: 0,
            tag: 14,
        });
    });

    it('preserves unsigned values for high 32-bit addresses', () => {
        const result = decomposeAddress(
            0xfffffffc,
            directMappedConfig,
            directMappedLayout,
        );

        expect(result.blockNumber).toBeGreaterThanOrEqual(0);
        expect(result.tag).toBeGreaterThanOrEqual(0);
        expect(result.blockNumber).toBe(
            result.tag * directMappedLayout.setCount + result.setIndex,
        );
        expect(0xfffffffc % directMappedConfig.blockSizeBytes).toBe(
            result.blockOffset * directMappedConfig.wordSizeBytes +
                result.byteOffset,
        );
    });
});
