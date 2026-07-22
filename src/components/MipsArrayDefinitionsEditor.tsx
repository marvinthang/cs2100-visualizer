import { useState } from 'react';
import {
    calculateMipsArrayDraftBaseAddress,
    setMipsArrayAddressFormat,
    setMipsArrayLengthMode,
} from '../core/mips/arrayDefinitionDraft';
import { registerNames } from '../core/mips/instruction/registers';
import type { AddressFormat } from '../types/memory';
import type { MipsArrayDefinitionDraft, RegisterNumber } from '../types/mips';
import {
    ArrayDefinitionCard,
    ArrayLayoutEditorHeader,
    ArrayLengthField,
    ArrayPlacementControl,
    EmptyArrayLayout,
} from './ArrayLayoutEditorParts';

const arrayNames = ['A', 'B', 'C'] as const;
const preferredRegisters: RegisterNumber[] = [
    16, 17, 18, 19, 20, 21, 22, 23, 8, 9, 10, 11, 12, 13, 14, 15,
];

export default function MipsArrayDefinitionsEditor({
    definitions,
    errors = [],
    onChange,
}: {
    definitions: MipsArrayDefinitionDraft[];
    errors?: string[];
    onChange: (definitions: MipsArrayDefinitionDraft[]) => void;
}) {
    const [emptyAddressFormat, setEmptyAddressFormat] =
        useState<AddressFormat>('hexadecimal');
    const addressFormat = definitions[0]?.addressFormat ?? emptyAddressFormat;

    function updateAddressFormat(format: AddressFormat) {
        setEmptyAddressFormat(format);
        onChange(setMipsArrayAddressFormat(definitions, format));
    }

    function updateDefinition(
        index: number,
        patch: Partial<MipsArrayDefinitionDraft>,
    ) {
        const nextDefinitions = definitions.map(
            (definition, definitionIndex) =>
                definitionIndex === index
                    ? { ...definition, ...patch }
                    : definition,
        );

        for (
            let definitionIndex = 1;
            definitionIndex < nextDefinitions.length;
            definitionIndex++
        ) {
            if (
                nextDefinitions[definitionIndex].lengthMode ===
                'same-as-previous'
            ) {
                nextDefinitions[definitionIndex] = {
                    ...nextDefinitions[definitionIndex],
                    length: nextDefinitions[definitionIndex - 1].length,
                };
            }
        }

        onChange(nextDefinitions);
    }

    function updateLengthMode(
        index: number,
        lengthMode: MipsArrayDefinitionDraft['lengthMode'],
    ) {
        onChange(setMipsArrayLengthMode(definitions, index, lengthMode));
    }

    function addDefinition() {
        const name = arrayNames.find(
            (candidate) =>
                !definitions.some(
                    (definition) => definition.name === candidate,
                ),
        );
        if (name === undefined) return;

        const usedRegisters = new Set(
            definitions.flatMap((definition) => [
                definition.baseAddressRegister,
                definition.lengthRegister,
            ]),
        );
        const availableRegisters = preferredRegisters.filter(
            (register) => !usedRegisters.has(register),
        );
        const baseAddressRegister = availableRegisters[0];
        const lengthRegister = availableRegisters[1];
        if (baseAddressRegister === undefined || lengthRegister === undefined) {
            return;
        }

        const nextDefinitions: MipsArrayDefinitionDraft[] = [
            ...definitions,
            {
                name,
                addressMode: name === 'A' ? 'fixed' : 'after-previous',
                baseAddress: `${arrayNames.indexOf(name) + 1}00`,
                lengthMode: 'fixed',
                length: '8',
                addressFormat,
                baseAddressRegister,
                lengthRegister,
                valuePattern: '',
            },
        ];

        onChange(nextDefinitions);
    }

    function removeLastDefinition() {
        const nextDefinitions = definitions.slice(0, -1);

        if (nextDefinitions.length === 0) {
            setEmptyAddressFormat(addressFormat);
        }

        onChange(nextDefinitions);
    }

    return (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
            <ArrayLayoutEditorHeader
                description="Elements are 4-byte words. Registers and repeating values initialize when the program runs."
                format={addressFormat}
                onFormatChange={updateAddressFormat}
                addDisabled={definitions.length >= arrayNames.length}
                removeDisabled={definitions.length === 0}
                onAdd={addDefinition}
                onRemove={removeLastDefinition}
            />

            {definitions.length === 0 ? (
                <EmptyArrayLayout />
            ) : (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {definitions.map((definition, index) => {
                        const previousDefinition = definitions[index - 1];
                        const calculatedAddress =
                            calculateMipsArrayDraftBaseAddress(
                                definitions,
                                index,
                            );

                        return (
                            <ArrayDefinitionCard
                                key={definition.name}
                                name={definition.name}
                            >
                                <ArrayPlacementControl
                                    mode={definition.addressMode}
                                    previousName={
                                        previousDefinition?.name ?? null
                                    }
                                    onChange={(addressMode) =>
                                        updateDefinition(index, {
                                            addressMode,
                                        })
                                    }
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    <label>
                                        <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Base /{' '}
                                            {addressFormat === 'hexadecimal'
                                                ? 'HEX'
                                                : 'DEC'}
                                        </span>
                                        {definition.addressMode ===
                                        'after-previous' ? (
                                            <span
                                                className={`mt-1 block rounded border px-2 py-1.5 font-mono text-xs font-semibold ${
                                                    calculatedAddress === null
                                                        ? 'border-red-200 bg-red-50 text-red-700'
                                                        : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                                }`}
                                            >
                                                {calculatedAddress === null
                                                    ? 'Invalid'
                                                    : addressFormat ===
                                                        'hexadecimal'
                                                      ? `0x${calculatedAddress
                                                            .toString(16)
                                                            .toUpperCase()
                                                            .padStart(8, '0')}`
                                                      : calculatedAddress}
                                            </span>
                                        ) : (
                                            <input
                                                type="text"
                                                inputMode="text"
                                                spellCheck={false}
                                                value={definition.baseAddress}
                                                onChange={(event) =>
                                                    updateDefinition(index, {
                                                        baseAddress:
                                                            event.target.value,
                                                    })
                                                }
                                                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                        )}
                                    </label>

                                    <ArrayLengthField
                                        value={definition.length}
                                        mode={definition.lengthMode}
                                        previousName={
                                            previousDefinition?.name ?? null
                                        }
                                        onModeChange={(lengthMode) =>
                                            updateLengthMode(index, lengthMode)
                                        }
                                        onChange={(length) =>
                                            updateDefinition(index, { length })
                                        }
                                    />
                                </div>

                                <label className="mt-2 block">
                                    <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Repeating values / DEC
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="text"
                                        spellCheck={false}
                                        value={definition.valuePattern}
                                        onChange={(event) =>
                                            updateDefinition(index, {
                                                valuePattern:
                                                    event.target.value,
                                            })
                                        }
                                        placeholder="1 2 3 4 or 1,2,3,4 · blank keeps memory"
                                        aria-label={`Array ${definition.name} repeating values`}
                                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-900 outline-none placeholder:text-[10px] placeholder:font-normal placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                                    />
                                </label>

                                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                                    <label>
                                        <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Address register
                                        </span>
                                        <select
                                            value={
                                                definition.baseAddressRegister
                                            }
                                            onChange={(event) =>
                                                updateDefinition(index, {
                                                    baseAddressRegister: Number(
                                                        event.target.value,
                                                    ) as RegisterNumber,
                                                })
                                            }
                                            className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            {registerNames.map(
                                                (name, register) =>
                                                    register === 0 ? null : (
                                                        <option
                                                            key={register}
                                                            value={register}
                                                        >
                                                            {name}
                                                        </option>
                                                    ),
                                            )}
                                        </select>
                                    </label>

                                    <label>
                                        <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Length register
                                        </span>
                                        <select
                                            value={definition.lengthRegister}
                                            onChange={(event) =>
                                                updateDefinition(index, {
                                                    lengthRegister: Number(
                                                        event.target.value,
                                                    ) as RegisterNumber,
                                                })
                                            }
                                            className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            {registerNames.map(
                                                (name, register) =>
                                                    register === 0 ? null : (
                                                        <option
                                                            key={register}
                                                            value={register}
                                                        >
                                                            {name}
                                                        </option>
                                                    ),
                                            )}
                                        </select>
                                    </label>
                                </div>
                            </ArrayDefinitionCard>
                        );
                    })}
                </div>
            )}

            {errors.length > 0 && (
                <ul className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {errors.map((error, index) => (
                        <li key={`${index}-${error}`}>{error}</li>
                    ))}
                </ul>
            )}
        </section>
    );
}
