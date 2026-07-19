import type { CacheTraceSourceMode } from '../arrayTraceDraft';

const sources: Array<{
    mode: CacheTraceSourceMode;
    label: string;
    description: string;
}> = [
    {
        mode: 'manual',
        label: 'Manual addresses',
        description: 'Use a trace supplied by the question',
    },
    {
        mode: 'array',
        label: 'Array pattern',
        description: 'Generate addresses from arrays and a loop',
    },
    {
        mode: 'mips',
        label: 'MIPS program',
        description: 'Generate addresses from a MIPS program',
    },
];

export default function TraceSourceSwitch({
    value,
    onChange,
}: {
    value: CacheTraceSourceMode;
    onChange: (value: CacheTraceSourceMode) => void;
}) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="px-1 sm:min-w-36">
                    <p className="text-xs font-semibold text-slate-900">
                        Trace source
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                        Choose what feeds the cache.
                    </p>
                </div>

                <fieldset className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 ring-1 ring-inset ring-slate-200 sm:max-w-4xl">
                    <legend className="sr-only">Trace source</legend>
                    {sources.map((source) => {
                        const selected = value === source.mode;

                        return (
                            <label
                                key={source.mode}
                                className={`flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded px-2 py-2 text-center transition focus-within:outline-none focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-1 ${
                                    selected
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="cache-trace-source"
                                    value={source.mode}
                                    checked={selected}
                                    onChange={() => onChange(source.mode)}
                                    className="sr-only"
                                />
                                <span
                                    aria-hidden="true"
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                        selected ? 'bg-sky-300' : 'bg-slate-300'
                                    }`}
                                />
                                <span className="min-w-0">
                                    <span className="block truncate text-xs font-semibold">
                                        {source.label}
                                    </span>
                                    <span
                                        className={`mt-0.5 hidden truncate font-mono text-[8px] uppercase tracking-wider xl:block ${
                                            selected
                                                ? 'text-slate-300'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {source.description}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </fieldset>
            </div>
        </section>
    );
}
