import type {
    CacheAccess,
    CacheAnalysis,
    CacheConfig,
    CacheLocality,
    CacheMissType,
    CacheSimulation,
    CacheStepAnalysis,
    CacheSummary,
} from '../../types/cache';
import { simulateCache } from './simulator';

function classifySteps(
    simulation: CacheSimulation,
    fullyAssociativeSimulation: CacheSimulation,
): CacheStepAnalysis[] {
    const lastAddressStep = new Map<number, number>();
    const lastBlockStep = new Map<number, number>();

    return simulation.steps.map((step, index) => {
        const relatedAddressStep = lastAddressStep.get(step.access.address);
        const relatedBlockStep = lastBlockStep.get(
            step.decomposedAddress.blockNumber,
        );

        let locality: CacheLocality | null = null;
        let relatedStep: number | null = null;

        if (relatedAddressStep !== undefined) {
            locality = 'temporal';
            relatedStep = relatedAddressStep;
        } else if (relatedBlockStep !== undefined) {
            locality = 'spatial';
            relatedStep = relatedBlockStep;
        }

        let missType: CacheMissType | null = null;
        if (!step.hit) {
            if (relatedBlockStep === undefined) {
                missType = 'compulsory';
            } else if (fullyAssociativeSimulation.steps[index].hit) {
                missType = 'conflict';
            } else {
                missType = 'capacity';
            }
        }

        lastAddressStep.set(step.access.address, index);
        lastBlockStep.set(step.decomposedAddress.blockNumber, index);

        return { missType, locality, relatedStep };
    });
}

export function analyzeCacheSimulation(
    config: CacheConfig,
    accesses: CacheAccess[],
): CacheAnalysis {
    const simulation = simulateCache(config, accesses);
    const fullyAssociativeSimulation = simulateCache(
        {
            ...config,
            wayCount: config.capacityBytes / config.blockSizeBytes,
        },
        accesses,
    );

    return {
        simulation,
        steps: classifySteps(simulation, fullyAssociativeSimulation),
    };
}

export function summarizeCacheAnalysis(analysis: CacheAnalysis): CacheSummary {
    const accessCount = analysis.simulation.steps.length;
    const { hitCount, missCount } = analysis.simulation;

    return {
        accessCount,
        hitCount,
        missCount,
        hitRate: accessCount > 0 ? hitCount / accessCount : null,
    };
}
