import {
    calculateArrayDraftBaseAddress,
    parseArrayDraftLength,
} from '../../core/memory/array';
import { parseAddressToken } from '../../core/memory/address';
import type { CacheArrayLoop, CacheArrayPattern } from '../../types/cache';
import type {
    AddressFormat,
    ArrayLengthMode,
    MemoryArrayDefinition,
} from '../../types/memory';

export type CacheTraceSourceMode = 'manual' | 'array' | 'mips';
export type ArrayDraftName = 'A' | 'B' | 'C';

export type ArrayDefinitionDraft = {
    name: ArrayDraftName;
    addressMode: 'fixed' | 'after-previous';
    baseAddress: string;
    lengthMode: ArrayLengthMode;
    length: string;
};

export type ArrayPatternDraft = {
    arrayName: ArrayDraftName;
    multiplier: string;
    offset: string;
};

export type ArrayLoopDraft = {
    startIndex: string;
    endExclusiveIndex: string;
    stride: string;
};

export type ArrayTraceDraft = {
    format: AddressFormat;
    arrays: ArrayDefinitionDraft[];
    patterns: ArrayPatternDraft[];
    loop: ArrayLoopDraft;
};

export type ParsedArrayTraceDraft = {
    definitions: MemoryArrayDefinition[];
    patterns: CacheArrayPattern[];
    loop: CacheArrayLoop | null;
    errors: string[];
};

function parseSignedDecimalInteger(value: string): number | null {
    const trimmed = value.trim();
    if (!/^[+-]?\d+$/.test(trimmed)) return null;

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseArrayTraceDraft(
    draft: ArrayTraceDraft,
): ParsedArrayTraceDraft {
    const errors: string[] = [];
    const definitions: MemoryArrayDefinition[] = [];

    draft.arrays.forEach((array, index) => {
        const baseAddress = calculateArrayDraftBaseAddress(
            draft.arrays,
            index,
            draft.format,
        );
        const length = parseArrayDraftLength(draft.arrays, index);

        if (baseAddress === null) {
            const previousArray = draft.arrays[index - 1];
            errors.push(
                array.addressMode === 'after-previous' && previousArray
                    ? `Array ${array.name}: cannot calculate an address after ${previousArray.name}.`
                    : `Array ${array.name}: enter a valid ${draft.format} base address.`,
            );
        }

        if (length === null) {
            errors.push(`Array ${array.name}: enter a valid length.`);
        }

        if (baseAddress !== null && length !== null) {
            definitions.push({
                name: array.name,
                baseAddress,
                length,
                elementSizeBytes: 4,
            });
        }
    });

    const patterns = draft.patterns.flatMap((pattern) => {
        const multiplier = parseSignedDecimalInteger(pattern.multiplier);
        const offset = parseSignedDecimalInteger(pattern.offset);

        if (multiplier === null) {
            errors.push(
                `Pattern for array ${pattern.arrayName}: enter a valid multiplier.`,
            );
        }
        if (offset === null) {
            errors.push(
                `Pattern for array ${pattern.arrayName}: enter a valid offset.`,
            );
        }

        return multiplier === null || offset === null
            ? []
            : [{ arrayName: pattern.arrayName, multiplier, offset }];
    });

    const startIndex = parseAddressToken(draft.loop.startIndex, 'decimal');
    const endExclusiveIndex = parseAddressToken(
        draft.loop.endExclusiveIndex,
        'decimal',
    );
    const stride = parseAddressToken(draft.loop.stride, 'decimal');

    if (startIndex === null) errors.push('Loop: enter a valid start index.');
    if (endExclusiveIndex === null) {
        errors.push('Loop: enter a valid end index.');
    }
    if (stride === null) errors.push('Loop: enter a valid stride.');

    return {
        definitions,
        patterns,
        loop:
            startIndex === null || endExclusiveIndex === null || stride === null
                ? null
                : { startIndex, endExclusiveIndex, stride },
        errors,
    };
}
