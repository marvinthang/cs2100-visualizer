import type {
    AddressDecomposition,
    CacheConfig,
    CacheLayout,
} from '../../types/cache';

export function validateCacheAddress(
    address: number,
    addressBits: number,
    wordSizeBytes: number,
): string | null {
    if (!Number.isSafeInteger(address)) {
        return 'Address must be an integer.';
    }

    if (address < 0 || address >= 2 ** addressBits) {
        return 'Address is out of bounds.';
    }

    if (address % wordSizeBytes !== 0) {
        return 'Address must be aligned to word size.';
    }

    return null;
}

export function decomposeAddress(
    address: number,
    config: CacheConfig,
    layout: CacheLayout,
): AddressDecomposition {
    const blockNumber = Math.floor(address / config.blockSizeBytes);
    const blockOffset =
        Math.floor(address / config.wordSizeBytes) % layout.wordCountPerBlock;
    const byteOffset = address % config.wordSizeBytes;
    const setIndex = blockNumber % layout.setCount;
    const tag = Math.floor(blockNumber / layout.setCount);

    return {
        blockNumber,
        blockOffset,
        byteOffset,
        setIndex,
        tag,
    };
}
