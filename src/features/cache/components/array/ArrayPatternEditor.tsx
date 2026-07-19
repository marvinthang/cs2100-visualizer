import type {
    ArrayDefinitionDraft,
    ArrayPatternDraft,
} from '../../arrayTraceDraft';

function previewPattern(pattern: ArrayPatternDraft): string {
    const coefficient =
        pattern.multiplier === '1' ? 'i' : `${pattern.multiplier}i`;
    const offset =
        pattern.offset === '0'
            ? ''
            : Number(pattern.offset) < 0
              ? ` - ${pattern.offset.slice(1)}`
              : ` + ${pattern.offset}`;

    return `${pattern.arrayName}[${coefficient}${offset}]`;
}

export default function ArrayPatternEditor({
    arrays,
    patterns,
    onChange,
}: {
    arrays: ArrayDefinitionDraft[];
    patterns: ArrayPatternDraft[];
    onChange: (patterns: ArrayPatternDraft[]) => void;
}) {
    function updatePattern(
        index: number,
        field: keyof ArrayPatternDraft,
        value: string,
    ) {
        onChange(
            patterns.map((pattern, patternIndex) =>
                patternIndex === index
                    ? { ...pattern, [field]: value }
                    : pattern,
            ),
        );
    }

    return (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold text-slate-900">
                        3 / Access order per iteration
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Index = multiplier × i + offset.
                    </p>
                </div>
                <button
                    type="button"
                    disabled={arrays.length === 0}
                    onClick={() =>
                        onChange([
                            ...patterns,
                            {
                                arrayName: arrays[0].name,
                                multiplier: '1',
                                offset: '0',
                            },
                        ])
                    }
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    + Add access
                </button>
            </div>

            <div className="mt-3 space-y-2">
                {patterns.map((pattern, index) => (
                    <div
                        key={index}
                        className="grid gap-2 rounded-md border border-slate-200 bg-white p-2 sm:grid-cols-[64px_minmax(90px,0.7fr)_1fr_1fr_minmax(120px,1fr)_auto] sm:items-end"
                    >
                        <span className="self-center font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Access {index + 1}
                        </span>
                        <label>
                            <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                Array
                            </span>
                            <select
                                value={pattern.arrayName}
                                onChange={(event) =>
                                    updatePattern(
                                        index,
                                        'arrayName',
                                        event.target.value,
                                    )
                                }
                                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            >
                                {arrays.map((array) => (
                                    <option key={array.name} value={array.name}>
                                        {array.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                Multiplier
                            </span>
                            <input
                                type="number"
                                value={pattern.multiplier}
                                onChange={(event) =>
                                    updatePattern(
                                        index,
                                        'multiplier',
                                        event.target.value,
                                    )
                                }
                                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </label>
                        <label>
                            <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                Offset
                            </span>
                            <input
                                type="number"
                                value={pattern.offset}
                                onChange={(event) =>
                                    updatePattern(
                                        index,
                                        'offset',
                                        event.target.value,
                                    )
                                }
                                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </label>
                        <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-xs font-semibold text-slate-700">
                            {previewPattern(pattern)}
                        </div>
                        <button
                            type="button"
                            disabled={patterns.length === 1}
                            onClick={() =>
                                onChange(
                                    patterns.filter(
                                        (_, patternIndex) =>
                                            patternIndex !== index,
                                    ),
                                )
                            }
                            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
