import { useState } from 'react';
import type { AddressFormat } from '../../../../types/memory';
import type {
    ArrayDefinitionDraft,
    ArrayLoopDraft,
    ArrayPatternDraft,
    ArrayTraceDraft,
} from '../../arrayTraceDraft';
import ArrayDefinitionsEditor from './ArrayDefinitionsEditor';
import ArrayPatternEditor from './ArrayPatternEditor';

const loopFields: Array<{
    key: keyof ArrayLoopDraft;
    label: string;
    min?: string;
}> = [
    { key: 'startIndex', label: 'Start i' },
    { key: 'endExclusiveIndex', label: 'End exclusive' },
    { key: 'stride', label: 'Step', min: '1' },
];

function ArrayLoopEditor({
    loop,
    onChange,
}: {
    loop: ArrayLoopDraft;
    onChange: (loop: ArrayLoopDraft) => void;
}) {
    return (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                2 / Loop range
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
                {loopFields.map((field) => (
                    <label key={field.key}>
                        <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {field.label}
                        </span>
                        <input
                            type="number"
                            min={field.min}
                            value={loop[field.key]}
                            onChange={(event) =>
                                onChange({
                                    ...loop,
                                    [field.key]: event.target.value,
                                })
                            }
                            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 font-mono text-sm font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </label>
                ))}
            </div>
        </section>
    );
}

const initialArrays: ArrayDefinitionDraft[] = [
    {
        name: 'A',
        addressMode: 'fixed',
        baseAddress: '100',
        lengthMode: 'fixed',
        length: '8',
    },
];
const initialPatterns: ArrayPatternDraft[] = [
    { arrayName: 'A', multiplier: '1', offset: '0' },
];
const initialLoop: ArrayLoopDraft = {
    startIndex: '0',
    endExclusiveIndex: '8',
    stride: '1',
};

export default function ArrayTraceInputPanel({
    format,
    onFormatChange,
    onDraftChange,
    onRun,
}: {
    format: AddressFormat;
    onFormatChange: (format: AddressFormat) => void;
    onDraftChange: () => void;
    onRun: (draft: ArrayTraceDraft) => void;
}) {
    const [arrays, setArrays] = useState(initialArrays);
    const [patterns, setPatterns] = useState(initialPatterns);
    const [loop, setLoop] = useState(initialLoop);

    function updateArrays(nextArrays: ArrayDefinitionDraft[]) {
        const availableNames = new Set(nextArrays.map((array) => array.name));
        setArrays(nextArrays);
        setPatterns((currentPatterns) =>
            currentPatterns.filter((pattern) =>
                availableNames.has(pattern.arrayName),
            ),
        );
        onDraftChange();
    }

    function updatePatterns(nextPatterns: ArrayPatternDraft[]) {
        setPatterns(nextPatterns);
        onDraftChange();
    }

    function updateLoop(nextLoop: ArrayLoopDraft) {
        setLoop(nextLoop);
        onDraftChange();
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onRun({ format, arrays, patterns, loop });
            }}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="border-b border-slate-200 bg-[#fbfcfd] px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Array trace generator
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Describe memory layout and the accesses made by each
                        loop iteration.
                    </p>
                </div>
            </div>

            <div className="grid gap-3 p-4">
                <ArrayDefinitionsEditor
                    arrays={arrays}
                    format={format}
                    onFormatChange={onFormatChange}
                    onChange={updateArrays}
                />
                <div className="grid gap-3 lg:grid-cols-[0.45fr_1.55fr]">
                    <ArrayLoopEditor loop={loop} onChange={updateLoop} />
                    <ArrayPatternEditor
                        arrays={arrays}
                        patterns={patterns}
                        onChange={updatePatterns}
                    />
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Output: ordered read accesses · 4 bytes per element
                    </p>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                    >
                        Generate and run
                        <span aria-hidden="true" className="font-mono">
                            →
                        </span>
                    </button>
                </div>
            </div>
        </form>
    );
}
