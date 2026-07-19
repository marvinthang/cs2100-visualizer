import type {
    AddressFormat,
    ArrayLengthMode,
    MemoryArrayDefinition,
} from '../../types/memory';
import { parseAddressToken } from './address';

const ADDRESS_SPACE_SIZE = 2 ** 32;

export type SequentialArrayDraft = {
    addressMode: 'fixed' | 'after-previous';
    baseAddress: string;
    lengthMode: ArrayLengthMode;
    length: string;
};

export function parseArrayDraftLength(
    arrays: readonly Pick<SequentialArrayDraft, 'length' | 'lengthMode'>[],
    index: number,
): number | null {
    const array = arrays[index];
    if (array === undefined) return null;

    if (index > 0 && array.lengthMode === 'same-as-previous') {
        return parseArrayDraftLength(arrays, index - 1);
    }

    const length = parseAddressToken(array.length, 'decimal');
    return length !== null && Number.isSafeInteger(length) ? length : null;
}

export function calculateArrayDraftBaseAddress(
    arrays: readonly SequentialArrayDraft[],
    index: number,
    format: AddressFormat,
): number | null {
    const array = arrays[index];
    if (array === undefined) return null;

    if (array.addressMode === 'fixed') {
        return parseAddressToken(array.baseAddress, format);
    }

    if (index === 0) return null;

    const previousBaseAddress = calculateArrayDraftBaseAddress(
        arrays,
        index - 1,
        format,
    );
    const previousLength = parseArrayDraftLength(arrays, index - 1);

    if (
        previousBaseAddress === null ||
        previousLength === null ||
        previousLength === 0
    ) {
        return null;
    }

    const address = previousBaseAddress + previousLength * 4;
    return Number.isSafeInteger(address) && address < ADDRESS_SPACE_SIZE
        ? address
        : null;
}

function validateArrayDefinition(
    definition: MemoryArrayDefinition,
): string | null {
    if (!Number.isSafeInteger(definition.baseAddress)) {
        return `Base address for array "${definition.name}" must be an integer.`;
    }
    if (definition.baseAddress < 0) {
        return `Base address for array "${definition.name}" must be non-negative.`;
    }
    if (definition.baseAddress >= ADDRESS_SPACE_SIZE) {
        return `Base address for array "${definition.name}" must fit within the 32-bit address range.`;
    }
    if (definition.baseAddress % definition.elementSizeBytes !== 0) {
        return `Base address for array "${definition.name}" must be aligned to ${definition.elementSizeBytes} bytes.`;
    }
    if (!Number.isSafeInteger(definition.length)) {
        return `Length for array "${definition.name}" must be a positive integer.`;
    }
    if (definition.length <= 0) {
        return `Length for array "${definition.name}" must be positive.`;
    }

    const endAddress =
        definition.baseAddress +
        definition.length * definition.elementSizeBytes;
    if (!Number.isSafeInteger(endAddress) || endAddress > ADDRESS_SPACE_SIZE) {
        return `Array "${definition.name}" extends beyond the 32-bit address space.`;
    }

    return null;
}

export function validateArrayDefinitions(
    definitions: MemoryArrayDefinition[],
): string[] {
    const errors: string[] = [];
    const names = new Set<string>();
    const validDefinitions: MemoryArrayDefinition[] = [];

    for (const definition of definitions) {
        const error = validateArrayDefinition(definition);
        if (error !== null) {
            errors.push(error);
        } else {
            validDefinitions.push(definition);
        }

        if (names.has(definition.name)) {
            errors.push(`Array name "${definition.name}" must be unique.`);
        }
        names.add(definition.name);
    }

    for (let index = 0; index < validDefinitions.length; index++) {
        const current = validDefinitions[index];
        const currentEnd =
            current.baseAddress + current.length * current.elementSizeBytes;

        for (let previousIndex = 0; previousIndex < index; previousIndex++) {
            const previous = validDefinitions[previousIndex];
            const previousEnd =
                previous.baseAddress +
                previous.length * previous.elementSizeBytes;

            if (
                Math.max(current.baseAddress, previous.baseAddress) <
                Math.min(currentEnd, previousEnd)
            ) {
                errors.push(
                    `Array "${current.name}" overlaps with array "${previous.name}".`,
                );
            }
        }
    }

    return errors;
}
