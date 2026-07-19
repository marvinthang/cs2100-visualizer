import type { AddressFormat } from '../../types/memory';
import type { MipsArrayDefinitionDraft } from '../../types/mips';
import { parseArrayDraftLength } from '../memory/array';
import { parseAddressToken } from '../memory/address';

export function calculateMipsArrayDraftBaseAddress(
    drafts: MipsArrayDefinitionDraft[],
    index: number,
): number | null {
    const draft = drafts[index];
    if (draft === undefined) return null;

    if (draft.addressMode === 'fixed') {
        return parseAddressToken(draft.baseAddress, draft.addressFormat);
    }

    const previousBaseAddress = calculateMipsArrayDraftBaseAddress(
        drafts,
        index - 1,
    );
    const previousLength = parseArrayDraftLength(drafts, index - 1);

    if (
        previousBaseAddress === null ||
        previousLength === null ||
        previousLength === 0
    ) {
        return null;
    }

    const address = previousBaseAddress + previousLength * 4;
    return Number.isSafeInteger(address) && address < 2 ** 32 ? address : null;
}

export function setMipsArrayAddressFormat(
    definitions: MipsArrayDefinitionDraft[],
    format: AddressFormat,
): MipsArrayDefinitionDraft[] {
    return definitions.map((definition) => ({
        ...definition,
        addressFormat: format,
    }));
}

export function setMipsArrayLengthMode(
    definitions: MipsArrayDefinitionDraft[],
    index: number,
    lengthMode: MipsArrayDefinitionDraft['lengthMode'],
): MipsArrayDefinitionDraft[] {
    const previousDefinition = definitions[index - 1];

    const updated = definitions.map((definition, definitionIndex) =>
        definitionIndex === index
            ? {
                  ...definition,
                  lengthMode,
                  ...(lengthMode === 'same-as-previous' && previousDefinition
                      ? {
                            length: previousDefinition.length,
                            lengthRegister: previousDefinition.lengthRegister,
                        }
                      : {}),
              }
            : definition,
    );

    for (
        let definitionIndex = 1;
        definitionIndex < updated.length;
        definitionIndex++
    ) {
        if (updated[definitionIndex].lengthMode === 'same-as-previous') {
            updated[definitionIndex] = {
                ...updated[definitionIndex],
                length: updated[definitionIndex - 1].length,
            };
        }
    }

    return updated;
}
