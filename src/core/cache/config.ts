import type { CacheConfig, CacheValidationResult } from '../../types/cache';

export function isPowerOfTwo(value: number): boolean {
    return (
        Number.isSafeInteger(value) && value > 0 && Math.log2(value) % 1 === 0
    );
}

export function isValidAssociativity(
    associativity: number,
    lineCount: number,
): boolean {
    return isPowerOfTwo(associativity) && associativity <= lineCount;
}

export function validateCacheConfig(
    config: CacheConfig,
): CacheValidationResult {
    if (!isPowerOfTwo(config.capacityBytes)) {
        return { valid: false, errors: ['Capacity must be a power of two.'] };
    }

    if (!isPowerOfTwo(config.blockSizeBytes)) {
        return { valid: false, errors: ['Block size must be a power of two.'] };
    }

    if (config.capacityBytes < config.blockSizeBytes) {
        return {
            valid: false,
            errors: ['Capacity must be greater than or equal to block size.'],
        };
    }

    if (config.blockSizeBytes < config.wordSizeBytes) {
        return {
            valid: false,
            errors: ['Block size must be greater than or equal to word size.'],
        };
    }

    const lineCount = config.capacityBytes / config.blockSizeBytes;

    if (!isValidAssociativity(config.wayCount, lineCount)) {
        return { valid: false, errors: ['Invalid way count.'] };
    }

    const wordCountPerBlock = config.blockSizeBytes / config.wordSizeBytes;
    const setCount = lineCount / config.wayCount;
    const byteOffsetBits = Math.log2(config.wordSizeBytes);
    const blockOffsetBits = Math.log2(wordCountPerBlock);
    const setIndexBits = Math.log2(setCount);
    const tagBits =
        config.addressBits - (setIndexBits + blockOffsetBits + byteOffsetBits);

    return {
        valid: true,
        layout: {
            lineCount,
            setCount,
            wordCountPerBlock,
            byteOffsetBits,
            blockOffsetBits,
            setIndexBits,
            tagBits,
        },
    };
}
