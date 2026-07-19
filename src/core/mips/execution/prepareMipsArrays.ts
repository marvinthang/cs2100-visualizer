import type { MemoryArrayDefinition } from '../../../types/memory';
import type {
    MipsArrayDefinitionDraft,
    RegisterNumber,
} from '../../../types/mips';
import {
    parseArrayDraftLength,
    validateArrayDefinitions,
} from '../../memory/array';
import { parseAddressToken } from '../../memory/address';
import { parseRegisterValue } from '../registerValueFormat';
import {
    writeRegister,
    type MachineState,
} from '../single-cycle/execution/machineState';

const MAX_INITIALIZED_ARRAY_WORDS = 100_000;

type PrepareMipsArraysResult = {
    machine: MachineState;
    definitions: MemoryArrayDefinition[];
    errors: string[];
};

export function parseMipsArrayValuePattern(value: string): number[] | null {
    const trimmed = value.trim();
    if (trimmed === '') return [];

    const parsedValues = trimmed
        .split(/[\s,]+/)
        .map((token) => parseRegisterValue(token, 'dec'));

    return parsedValues.some((parsedValue) => parsedValue === null)
        ? null
        : (parsedValues as number[]);
}

export function prepareMipsArrays(
    initialMachine: MachineState,
    drafts: MipsArrayDefinitionDraft[],
): PrepareMipsArraysResult {
    const definitions: MemoryArrayDefinition[] = [];
    const valuePatterns: Array<number[] | null> = [];
    const errors: string[] = [];
    const usedRegisters = new Map<
        RegisterNumber,
        | { kind: 'base'; description: string }
        | { kind: 'length'; description: string; value: number | null }
    >();

    function claimBaseRegister(
        register: RegisterNumber,
        description: string,
    ): void {
        if (register === 0) {
            errors.push(`${description} cannot use $zero.`);
            return;
        }

        const previous = usedRegisters.get(register);
        if (previous !== undefined) {
            errors.push(
                `${description} also uses the register selected for ${previous.description}.`,
            );
            return;
        }

        usedRegisters.set(register, { kind: 'base', description });
    }

    function claimLengthRegister(
        register: RegisterNumber,
        description: string,
        value: number | null,
    ): void {
        if (register === 0) {
            errors.push(`${description} cannot use $zero.`);
            return;
        }

        const previous = usedRegisters.get(register);
        if (previous?.kind === 'base') {
            errors.push(
                `${description} also uses the register selected for ${previous.description}.`,
            );
            return;
        }

        if (
            previous?.kind === 'length' &&
            previous.value !== null &&
            value !== null &&
            previous.value !== value
        ) {
            errors.push(
                `${description} cannot share its register with ${previous.description} because their values differ.`,
            );
            return;
        }

        if (previous === undefined) {
            usedRegisters.set(register, {
                kind: 'length',
                description,
                value,
            });
        }
    }

    let previousDefinition: MemoryArrayDefinition | null = null;

    for (const [draftIndex, draft] of drafts.entries()) {
        const name = draft.name.trim();
        const length = parseArrayDraftLength(drafts, draftIndex);
        const valuePattern = parseMipsArrayValuePattern(draft.valuePattern);
        valuePatterns.push(valuePattern);

        if (name === '') {
            errors.push('Enter a name for every array.');
        }

        let baseAddress: number | null = null;

        if (draft.addressMode === 'fixed') {
            baseAddress = parseAddressToken(
                draft.baseAddress,
                draft.addressFormat,
            );

            if (baseAddress === null) {
                errors.push(
                    `Array ${name || '?'}: enter a valid base address.`,
                );
            }
        } else {
            if (previousDefinition === null) {
                errors.push(
                    `Array ${name || '?'}: there is no previous array to follow.`,
                );
            } else {
                const nextAddress =
                    previousDefinition.baseAddress +
                    previousDefinition.length *
                        previousDefinition.elementSizeBytes;

                if (nextAddress >= 2 ** 32) {
                    errors.push(
                        `Array ${name || '?'}: address after ${previousDefinition.name} exceeds the 32-bit address space.`,
                    );
                } else {
                    baseAddress = nextAddress;
                }
            }
        }

        if (length === null || length === 0) {
            errors.push(`Array ${name || '?'}: enter a positive length.`);
        }

        if (valuePattern === null) {
            errors.push(
                `Array ${name || '?'}: enter decimal values separated by spaces or commas.`,
            );
        }

        if (
            length !== null &&
            valuePattern !== null &&
            valuePattern.length > 0 &&
            length > MAX_INITIALIZED_ARRAY_WORDS
        ) {
            errors.push(
                `Array ${name || '?'}: repeating values can initialize at most ${MAX_INITIALIZED_ARRAY_WORDS.toLocaleString('en-US')} elements.`,
            );
        }

        claimBaseRegister(
            draft.baseAddressRegister,
            `Array ${name || '?'} base address`,
        );
        claimLengthRegister(
            draft.lengthRegister,
            `Array ${name || '?'} length`,
            length !== null && length > 0 ? length : null,
        );

        if (
            name !== '' &&
            baseAddress !== null &&
            length !== null &&
            length > 0
        ) {
            const definition: MemoryArrayDefinition = {
                name,
                baseAddress,
                length,
                elementSizeBytes: 4,
            };

            definitions.push(definition);
            previousDefinition = definition;
        } else {
            previousDefinition = null;
        }
    }

    errors.push(...validateArrayDefinitions(definitions));

    if (errors.length > 0) {
        return { machine: initialMachine, definitions: [], errors };
    }

    let machine = initialMachine;
    let dataMemory = machine.dataMemory;
    let initializedMemory = false;

    for (let index = 0; index < drafts.length; index++) {
        machine = writeRegister(
            machine,
            drafts[index].baseAddressRegister,
            definitions[index].baseAddress | 0,
        );
        machine = writeRegister(
            machine,
            drafts[index].lengthRegister,
            definitions[index].length,
        );

        const valuePattern = valuePatterns[index];
        if (valuePattern !== null && valuePattern.length > 0) {
            if (!initializedMemory) {
                dataMemory = { ...dataMemory };
                initializedMemory = true;
            }

            for (
                let elementIndex = 0;
                elementIndex < definitions[index].length;
                elementIndex++
            ) {
                const address =
                    definitions[index].baseAddress + elementIndex * 4;
                dataMemory[address] =
                    valuePattern[elementIndex % valuePattern.length];
            }
        }
    }

    if (initializedMemory) {
        machine = { ...machine, dataMemory };
    }

    return { machine, definitions, errors: [] };
}
