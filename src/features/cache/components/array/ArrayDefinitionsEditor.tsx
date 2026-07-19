import type { AddressFormat } from '../../../../types/memory';
import { calculateArrayDraftBaseAddress } from '../../../../core/memory/array';
import {
    ArrayDefinitionCard,
    ArrayLayoutEditorHeader,
    ArrayLengthField,
    ArrayPlacementControl,
    EmptyArrayLayout,
} from '../../../../components/ArrayLayoutEditorParts';
import type {
    ArrayDefinitionDraft,
    ArrayDraftName,
} from '../../arrayTraceDraft';

const arrayNames: ArrayDraftName[] = ['A', 'B', 'C'];

export default function ArrayDefinitionsEditor({
    arrays,
    format,
    onFormatChange,
    onChange,
}: {
    arrays: ArrayDefinitionDraft[];
    format: AddressFormat;
    onFormatChange: (format: AddressFormat) => void;
    onChange: (arrays: ArrayDefinitionDraft[]) => void;
}) {
    function updateArray(
        index: number,
        changes: Partial<ArrayDefinitionDraft>,
    ) {
        const nextArrays = arrays.map((array, arrayIndex) =>
            arrayIndex === index ? { ...array, ...changes } : array,
        );

        for (let arrayIndex = 1; arrayIndex < nextArrays.length; arrayIndex++) {
            if (nextArrays[arrayIndex].lengthMode === 'same-as-previous') {
                nextArrays[arrayIndex] = {
                    ...nextArrays[arrayIndex],
                    length: nextArrays[arrayIndex - 1].length,
                };
            }
        }

        onChange(nextArrays);
    }

    function updateLengthMode(
        index: number,
        lengthMode: ArrayDefinitionDraft['lengthMode'],
    ) {
        updateArray(index, {
            lengthMode,
            ...(lengthMode === 'same-as-previous' && arrays[index - 1]
                ? { length: arrays[index - 1].length }
                : {}),
        });
    }

    function addArray() {
        const name = arrayNames.find(
            (candidate) => !arrays.some((array) => array.name === candidate),
        );
        if (name === undefined) return;

        const nextArrays: ArrayDefinitionDraft[] = [
            ...arrays,
            {
                name,
                addressMode: name === 'A' ? 'fixed' : 'after-previous',
                baseAddress: `${arrayNames.indexOf(name) + 1}00`,
                lengthMode: 'fixed',
                length: '8',
            },
        ];

        onChange(nextArrays);
    }

    return (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <ArrayLayoutEditorHeader
                title="Memory layout"
                stepLabel="1"
                description="Element size is fixed at one 4-byte word."
                format={format}
                onFormatChange={onFormatChange}
                addDisabled={arrays.length >= arrayNames.length}
                removeDisabled={arrays.length === 0}
                onAdd={addArray}
                onRemove={() => onChange(arrays.slice(0, -1))}
            />

            {arrays.length === 0 ? (
                <EmptyArrayLayout />
            ) : (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {arrays.map((array, index) => {
                        const previousArray = arrays[index - 1];
                        const calculatedBaseAddress =
                            calculateArrayDraftBaseAddress(
                                arrays,
                                index,
                                format,
                            );

                        return (
                            <ArrayDefinitionCard
                                key={array.name}
                                name={array.name}
                            >
                                <ArrayPlacementControl
                                    mode={array.addressMode}
                                    previousName={previousArray?.name ?? null}
                                    onChange={(addressMode) =>
                                        updateArray(index, { addressMode })
                                    }
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    <label>
                                        <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                            Base /{' '}
                                            {format === 'hexadecimal'
                                                ? 'HEX'
                                                : 'DEC'}
                                        </span>
                                        {array.addressMode ===
                                        'after-previous' ? (
                                            <span className="mt-1 block rounded border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-xs font-semibold text-slate-700">
                                                {calculatedBaseAddress === null
                                                    ? 'Invalid'
                                                    : format === 'hexadecimal'
                                                      ? `0x${calculatedBaseAddress
                                                            .toString(16)
                                                            .toUpperCase()
                                                            .padStart(8, '0')}`
                                                      : calculatedBaseAddress}
                                            </span>
                                        ) : (
                                            <input
                                                type="text"
                                                inputMode="text"
                                                value={array.baseAddress}
                                                onChange={(event) =>
                                                    updateArray(index, {
                                                        baseAddress:
                                                            event.target.value,
                                                    })
                                                }
                                                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                            />
                                        )}
                                    </label>
                                    <ArrayLengthField
                                        value={array.length}
                                        mode={array.lengthMode}
                                        previousName={
                                            previousArray?.name ?? null
                                        }
                                        onModeChange={(lengthMode) =>
                                            updateLengthMode(index, lengthMode)
                                        }
                                        onChange={(length) =>
                                            updateArray(index, { length })
                                        }
                                    />
                                </div>
                            </ArrayDefinitionCard>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
