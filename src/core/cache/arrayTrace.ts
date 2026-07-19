import type {
    CacheArrayPattern,
    CacheArrayTraceResult,
    CacheArrayLoop,
    CacheAccess,
} from '../../types/cache';
import type { MemoryArrayDefinition } from '../../types/memory';
import { validateArrayDefinitions } from '../memory/array';
import { describeCacheAccessLimit, MAX_CACHE_ACCESSES } from './simulator';

const ADDRESS_SPACE_SIZE = 2 ** 32;

export function generateArrayTrace(
    arrayDefinitions: MemoryArrayDefinition[],
    patterns: CacheArrayPattern[],
    loop: CacheArrayLoop,
    maxAccesses = MAX_CACHE_ACCESSES,
): CacheArrayTraceResult {
    const accesses: CacheAccess[] = [];
    const errors = validateArrayDefinitions(arrayDefinitions);

    if (patterns.length === 0) {
        errors.push('At least one array access pattern is required.');
    }

    if (
        patterns.some(
            ({ multiplier, offset }) =>
                !Number.isSafeInteger(multiplier) ||
                !Number.isSafeInteger(offset),
        )
    ) {
        errors.push('Array pattern multipliers and offsets must be integers.');
    }

    if (!Number.isSafeInteger(loop.stride) || loop.stride <= 0) {
        errors.push('Loop stride must be positive.');
    }

    if (
        !Number.isSafeInteger(loop.startIndex) ||
        !Number.isSafeInteger(loop.endExclusiveIndex)
    ) {
        errors.push('Loop start and end indices must be integers.');
    }

    if (loop.startIndex >= loop.endExclusiveIndex) {
        errors.push(
            `Loop start index (${loop.startIndex}) must be less than end index (${loop.endExclusiveIndex}).`,
        );
    }

    if (
        Number.isSafeInteger(loop.startIndex) &&
        Number.isSafeInteger(loop.endExclusiveIndex) &&
        Number.isSafeInteger(loop.stride) &&
        loop.stride > 0 &&
        Math.ceil((loop.endExclusiveIndex - loop.startIndex) / loop.stride) >
            maxAccesses
    ) {
        errors.push(
            `An array loop can execute at most ${maxAccesses.toLocaleString('en-US')} iterations.`,
        );
    }

    const arraysByName = new Map(
        arrayDefinitions.map((arrayDef) => [arrayDef.name, arrayDef]),
    );
    for (const pattern of patterns) {
        if (!arraysByName.has(pattern.arrayName)) {
            errors.push(
                `Array definition for "${pattern.arrayName}" not found.`,
            );
        }
    }

    if (errors.length > 0) {
        return { accesses, errors };
    }

    for (
        let i = loop.startIndex;
        i < loop.endExclusiveIndex;
        i += loop.stride
    ) {
        for (const pattern of patterns) {
            const arrayDef = arraysByName.get(pattern.arrayName);

            if (arrayDef === undefined) {
                continue;
            }

            const index = i * pattern.multiplier + pattern.offset;
            if (
                !Number.isSafeInteger(index) ||
                index < 0 ||
                index >= arrayDef.length
            ) {
                continue;
            }

            const address =
                arrayDef.baseAddress + index * arrayDef.elementSizeBytes;

            if (
                !Number.isSafeInteger(address) ||
                address >= ADDRESS_SPACE_SIZE
            ) {
                errors.push(
                    `Address ${address} generated for "${arrayDef.name}[${index}]" is outside the 32-bit address range.`,
                );
                continue;
            }

            if (accesses.length >= maxAccesses) {
                errors.push(describeCacheAccessLimit(maxAccesses));
                return { accesses, errors };
            }

            accesses.push({
                ordinal: accesses.length,
                operation: 'read',
                address,
                label: `${arrayDef.name}[${index}]`,
            });
        }
    }

    return { accesses, errors };
}

export function getArrayElementLabel(
    address: number,
    arrayDefinitions: MemoryArrayDefinition[],
): string | null {
    for (const arrayDef of arrayDefinitions) {
        const offset = address - arrayDef.baseAddress;

        if (
            offset < 0 ||
            offset >= arrayDef.length * arrayDef.elementSizeBytes
        ) {
            continue;
        }

        if (offset % arrayDef.elementSizeBytes !== 0) {
            continue;
        }

        const index = offset / arrayDef.elementSizeBytes;
        return `${arrayDef.name}[${index}]`;
    }

    return null;
}
