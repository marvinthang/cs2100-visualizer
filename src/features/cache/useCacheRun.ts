import { useState } from 'react';
import { analyzeCacheSimulation } from '../../core/cache/analysis';
import {
    describeCacheAccessLimit,
    MAX_CACHE_ACCESSES,
} from '../../core/cache/simulator';
import type {
    MipsCacheAccessMode,
    MipsCacheTrace,
} from '../../core/cache/mipsTrace';
import type {
    CacheAccess,
    CacheAnalysis,
    CacheConfig,
} from '../../types/cache';
import type { AddressFormat, MemoryArrayDefinition } from '../../types/memory';
import type { CacheTraceSourceMode } from './arrayTraceDraft';

export type ActiveCacheRun = {
    analysis: CacheAnalysis;
    sourceMode: CacheTraceSourceMode;
    addressFormat: AddressFormat;
    arrayDefinitions: MemoryArrayDefinition[];
    mipsTrace: MipsCacheTrace | null;
    mipsAccessMode: MipsCacheAccessMode | null;
};

export type CacheRunContext = Omit<ActiveCacheRun, 'analysis'>;

export type CacheRunResult =
    | { ok: true; run: ActiveCacheRun }
    | { ok: false; error: string };

export function buildCacheRun(
    config: CacheConfig,
    accesses: CacheAccess[],
    context: CacheRunContext,
): CacheRunResult {
    if (accesses.length > MAX_CACHE_ACCESSES) {
        return { ok: false, error: describeCacheAccessLimit() };
    }

    try {
        return {
            ok: true,
            run: {
                analysis: analyzeCacheSimulation(config, accesses),
                ...context,
            },
        };
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'The trace could not be simulated.',
        };
    }
}

export function useCacheRun(config: CacheConfig) {
    const [activeRun, setActiveRun] = useState<ActiveCacheRun | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [selectedStepIndex, setSelectedStepIndex] = useState(0);
    const [isStale, setIsStale] = useState(false);

    function reportErrors(nextErrors: string[]) {
        setErrors(nextErrors);
    }

    function markDraftChanged() {
        setErrors([]);
        if (activeRun !== null) setIsStale(true);
    }

    function runAccesses(
        accesses: CacheAccess[],
        context: CacheRunContext,
    ): boolean {
        const result = buildCacheRun(config, accesses, context);
        if (!result.ok) {
            setErrors([result.error]);
            return false;
        }

        setActiveRun(result.run);
        setErrors([]);
        setSelectedStepIndex(0);
        setIsStale(false);
        return true;
    }

    return {
        activeRun,
        errors,
        isStale,
        selectedStepIndex,
        markDraftChanged,
        reportErrors,
        runAccesses,
        setSelectedStepIndex,
    };
}
