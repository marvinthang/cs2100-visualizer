import type {
    CacheConfig,
    CacheLine,
    CacheStepResult,
} from '../../types/cache';
import type { MemoryArrayDefinition } from '../../types/memory';

const ARRAY_BADGE_CLASSES = [
    'bg-cyan-50 text-cyan-800 ring-cyan-200',
    'bg-violet-50 text-violet-700 ring-violet-200',
    'bg-amber-50 text-amber-800 ring-amber-200',
];

export type ArrayCacheStats = {
    name: string;
    accessCount: number;
    hitCount: number;
    missCount: number;
};

export function getArrayBadgeClass(index: number): string {
    return (
        ARRAY_BADGE_CLASSES[index] ??
        'bg-slate-100 text-slate-700 ring-slate-200'
    );
}

export function getArrayCacheStats(
    steps: CacheStepResult[],
    definitions: MemoryArrayDefinition[],
): ArrayCacheStats[] {
    const stats = definitions.map(({ name }) => ({
        name,
        accessCount: 0,
        hitCount: 0,
        missCount: 0,
    }));

    for (const step of steps) {
        const arrayIndex = definitions.findIndex(
            ({ baseAddress, length, elementSizeBytes }) =>
                step.access.address >= baseAddress &&
                step.access.address < baseAddress + length * elementSizeBytes,
        );
        if (arrayIndex === -1) continue;

        stats[arrayIndex].accessCount++;
        if (step.hit) {
            stats[arrayIndex].hitCount++;
        } else {
            stats[arrayIndex].missCount++;
        }
    }

    return stats;
}

export type InstructionWordLayout = {
    baseAddress: number;
    instructionCount: number;
};

export type VisibleCacheRow =
    | { kind: 'set'; setIndex: number }
    | { kind: 'gap'; from: number; to: number };

export function buildVisibleCacheRows(
    setCount: number,
    activeSetIndex: number,
): VisibleCacheRow[] {
    if (setCount <= 12) {
        return Array.from({ length: setCount }, (_, setIndex) => ({
            kind: 'set' as const,
            setIndex,
        }));
    }

    const visibleSetIndices = new Set<number>([
        0,
        1,
        setCount - 2,
        setCount - 1,
    ]);
    for (let offset = -2; offset <= 2; offset++) {
        const setIndex = activeSetIndex + offset;
        if (setIndex >= 0 && setIndex < setCount) {
            visibleSetIndices.add(setIndex);
        }
    }

    const sortedSetIndices = [...visibleSetIndices].sort(
        (left, right) => left - right,
    );
    const rows: VisibleCacheRow[] = [];

    sortedSetIndices.forEach((setIndex, index) => {
        const previousSetIndex = sortedSetIndices[index - 1];
        if (previousSetIndex !== undefined && setIndex - previousSetIndex > 1) {
            rows.push({
                kind: 'gap',
                from: previousSetIndex + 1,
                to: setIndex - 1,
            });
        }
        rows.push({ kind: 'set', setIndex });
    });

    return rows;
}

export function getDisplayLruWay(ways: CacheLine[]): number | null {
    if (ways.length < 2 || ways.some((line) => !line.valid)) {
        return null;
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

export function getInstructionWordLabel(
    address: number,
    instructionLayout: InstructionWordLayout | null,
): string | null {
    if (instructionLayout === null) {
        return null;
    }

    const offset = address - instructionLayout.baseAddress;
    if (
        offset < 0 ||
        offset % 4 !== 0 ||
        offset / 4 >= instructionLayout.instructionCount
    ) {
        return null;
    }

    return `I${offset / 4 + 1}`;
}

export function getCacheLineWordAddresses(
    line: CacheLine,
    config: CacheConfig,
): number[] {
    if (!line.valid || line.blockNumber === null) {
        return [];
    }

    const wordCount = config.blockSizeBytes / config.wordSizeBytes;
    const blockBaseAddress = line.blockNumber * config.blockSizeBytes;

    return Array.from(
        { length: wordCount },
        (_, wordIndex) => blockBaseAddress + wordIndex * config.wordSizeBytes,
    );
}

export function scrollCacheSetIntoView(
    element: Pick<HTMLElement, 'scrollIntoView'>,
    reducedMotion: boolean,
) {
    element.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest',
    });
}
