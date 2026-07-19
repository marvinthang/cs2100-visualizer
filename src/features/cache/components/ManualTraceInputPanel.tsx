import type { AddressFormat } from '../../../types/memory';
import { SegmentButton } from '../../../components/SegmentedControl';

export default function ManualTraceInputPanel({
    format,
    source,
    onFormatChange,
    onSourceChange,
    onRun,
}: {
    format: AddressFormat;
    source: string;
    onFormatChange: (format: AddressFormat) => void;
    onSourceChange: (source: string) => void;
    onRun: () => void;
}) {
    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                        Address trace
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Paste addresses in the number base used by the question.
                    </p>
                </div>

                <div className="w-full sm:w-[180px]">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Number base
                    </span>
                    <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1 ring-1 ring-slate-200">
                        <SegmentButton
                            value="hexadecimal"
                            selected={format === 'hexadecimal'}
                            onSelect={onFormatChange}
                        >
                            HEX
                        </SegmentButton>
                        <SegmentButton
                            value="decimal"
                            selected={format === 'decimal'}
                            onSelect={onFormatChange}
                        >
                            DEC
                        </SegmentButton>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <textarea
                    aria-label="Address trace"
                    value={source}
                    onChange={(event) => onSourceChange(event.target.value)}
                    placeholder={
                        format === 'hexadecimal' ? '0 4 8 C 0' : '0 4 8 12 0'
                    }
                    spellCheck={false}
                    className="min-h-40 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-3 font-mono text-sm leading-7 text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        Spaces, commas, or new lines · interpreted strictly as{' '}
                        {format}
                    </p>
                    <button
                        type="button"
                        onClick={onRun}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                    >
                        Run trace
                        <span aria-hidden="true" className="font-mono">
                            →
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
}
