import type {
    AddressDecomposition,
    CacheAccess,
    CacheConfig,
    CacheLayout,
    CacheLine,
    CacheSimulation,
    CacheState,
    CacheStepResult,
} from '../../types/cache';
import { decomposeAddress, validateCacheAddress } from './address';
import { validateCacheConfig } from './config';

export const MAX_CACHE_ACCESSES = 50_000;

export function describeCacheAccessLimit(limit = MAX_CACHE_ACCESSES): string {
    return `A cache trace can contain at most ${limit.toLocaleString('en-US')} accesses.`;
}

export function createInitialCacheState(
    config: CacheConfig,
    layout: CacheLayout,
): CacheState {
    return {
        config,
        sets: Array.from({ length: layout.setCount }, () => ({
            ways: Array.from({ length: config.wayCount }, () => ({
                valid: false,
                tag: null,
                blockNumber: null,
                lastAccessedAtStep: null,
            })),
        })),
    };
}

function loadCacheLine(
    decomposedAddress: AddressDecomposition,
    step: number,
): CacheLine {
    return {
        valid: true,
        tag: decomposedAddress.tag,
        blockNumber: decomposedAddress.blockNumber,
        lastAccessedAtStep: step,
    };
}

function findLruWayIndex(ways: CacheLine[]): number {
    if (ways.length === 0) {
        throw new Error('No ways available to find LRU');
    }

    return ways.reduce(
        (oldestIndex, line, index) =>
            (line.lastAccessedAtStep ?? -1) <
            (ways[oldestIndex].lastAccessedAtStep ?? -1)
                ? index
                : oldestIndex,
        0,
    );
}

export function simulateCacheAccess(
    state: CacheState,
    layout: CacheLayout,
    access: CacheAccess,
    step: number,
): CacheStepResult {
    const decomposition = decomposeAddress(
        access.address,
        state.config,
        layout,
    );

    const set = state.sets[decomposition.setIndex];
    const hitWayIndex = set.ways.findIndex(
        (line) => line.valid && line.tag === decomposition.tag,
    );

    if (hitWayIndex !== -1) {
        return {
            access,
            decomposedAddress: decomposition,

            hit: true,
            wayIndex: hitWayIndex,

            evictedLine: null,
            stateAfter: {
                ...state,
                sets: state.sets.map((set, setIndex) =>
                    setIndex === decomposition.setIndex
                        ? {
                              ...set,
                              ways: set.ways.map((line, wayIndex) =>
                                  wayIndex === hitWayIndex
                                      ? {
                                            ...line,
                                            lastAccessedAtStep: step,
                                        }
                                      : line,
                              ),
                          }
                        : set,
                ),
            },
        };
    }

    const lruWayIndex = findLruWayIndex(set.ways);
    const evictedLine = set.ways[lruWayIndex].valid
        ? set.ways[lruWayIndex]
        : null;

    const stateAfter = {
        ...state,
        sets: state.sets.map((set, setIndex) =>
            setIndex === decomposition.setIndex
                ? {
                      ...set,
                      ways: set.ways.map((line, wayIndex) =>
                          wayIndex === lruWayIndex
                              ? loadCacheLine(decomposition, step)
                              : line,
                      ),
                  }
                : set,
        ),
    };

    return {
        access,
        decomposedAddress: decomposition,

        hit: false,
        wayIndex: lruWayIndex,

        evictedLine,
        stateAfter,
    };
}

export function simulateCache(
    config: CacheConfig,
    accesses: CacheAccess[],
): CacheSimulation {
    const validation = validateCacheConfig(config);
    if (!validation.valid) {
        throw new Error(
            `Invalid cache configuration: ${validation.errors.join(', ')}`,
        );
    }

    const initialState = createInitialCacheState(config, validation.layout);

    const steps: CacheStepResult[] = [];
    let state = initialState;
    let hitCount = 0;

    accesses.forEach((access, index) => {
        const addressError = validateCacheAddress(
            access.address,
            config.addressBits,
            config.wordSizeBytes,
        );

        if (addressError !== null) {
            throw new Error(
                `Access ${index + 1} at ${access.address}: ${addressError}`,
            );
        }

        const result = simulateCacheAccess(
            state,
            validation.layout,
            access,
            index,
        );

        steps.push(result);
        state = result.stateAfter;

        if (result.hit) {
            hitCount++;
        }
    });

    return {
        initialState,
        steps,
        hitCount,
        missCount: accesses.length - hitCount,
    };
}
