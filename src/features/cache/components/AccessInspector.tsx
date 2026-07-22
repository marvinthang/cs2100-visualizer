import type {
    CacheLayout,
    CacheStepAnalysis,
    CacheStepResult,
} from '../../../types/cache';
import type { AddressFormat } from '../../../types/memory';
import { formatAddress, formatHex } from '../format';

function BitField({
    label,
    bits,
    value,
    className,
}: {
    label: string;
    bits: number;
    value: string;
    className: string;
}) {
    return (
        <div
            className={`flex min-w-[76px] flex-col justify-between px-3 py-3 ${className}`}
            style={{
                flexGrow: Math.max(bits, 1),
                flexBasis: 0,
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                    {label}
                </span>
                <span className="font-mono text-[10px] opacity-65">
                    {bits}b
                </span>
            </div>
            <span className="mt-3 truncate font-mono text-sm font-bold">
                {value}
            </span>
        </div>
    );
}

export default function AccessInspector({
    step,
    stepAnalysis,
    layout,
    selectedStepIndex,
    format,
}: {
    step: CacheStepResult;
    stepAnalysis: CacheStepAnalysis;
    layout: CacheLayout;
    selectedStepIndex: number;
    format: AddressFormat;
}) {
    return (
        <aside className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm 2xl:sticky 2xl:top-4">
            <div className="border-b border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                            Decoder / access {selectedStepIndex + 1}
                        </p>
                        {step.access.label && (
                            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                {step.access.label}
                            </h2>
                        )}
                        <p
                            className={`font-mono font-bold tracking-tight ${
                                step.access.label
                                    ? 'mt-0.5 text-sm text-slate-600 dark:text-slate-400'
                                    : 'mt-1 text-xl text-slate-900 dark:text-slate-100'
                            }`}
                        >
                            {formatAddress(step.access.address, format)}
                        </p>
                    </div>
                    <span
                        className={`px-3 py-2 font-mono text-xs font-bold uppercase ${
                            step.hit
                                ? 'rounded-md bg-emerald-100 text-emerald-700'
                                : 'rounded-md bg-rose-100 text-rose-700'
                        }`}
                    >
                        {step.hit ? 'Hit' : 'Miss'}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    32-bit address split
                </p>
                <div className="flex min-h-24 overflow-x-auto overflow-y-hidden rounded-md border border-slate-200 dark:border-slate-800">
                    <BitField
                        label="Tag"
                        bits={layout.tagBits}
                        value={formatHex(step.decomposedAddress.tag)}
                        className="bg-slate-900 text-white"
                    />
                    <BitField
                        label="Set"
                        bits={layout.setIndexBits}
                        value={String(step.decomposedAddress.setIndex)}
                        className="bg-sky-100 text-sky-700"
                    />
                    <BitField
                        label="Word"
                        bits={layout.blockOffsetBits}
                        value={String(step.decomposedAddress.blockOffset)}
                        className="bg-emerald-100 text-emerald-700"
                    />
                    <BitField
                        label="Byte"
                        bits={layout.byteOffsetBits}
                        value={String(step.decomposedAddress.byteOffset)}
                        className="bg-amber-100 text-amber-700"
                    />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800 text-center ring-1 ring-slate-200 dark:ring-slate-800">
                    {[
                        ['Block', step.decomposedAddress.blockNumber],
                        ['Set', step.decomposedAddress.setIndex],
                        ['Way', step.wayIndex],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="bg-white dark:bg-slate-800 p-3"
                        >
                            <span className="block font-mono text-base font-bold">
                                {value}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900">
                    {stepAnalysis.missType && (
                        <p className="font-bold capitalize">
                            {stepAnalysis.missType} miss
                        </p>
                    )}
                    {stepAnalysis.locality ? (
                        <p>
                            <span className="capitalize">
                                {stepAnalysis.locality}
                            </span>{' '}
                            locality links this to access{' '}
                            {(stepAnalysis.relatedStep ?? 0) + 1}.
                        </p>
                    ) : (
                        <p>
                            This block has no prior locality evidence in the
                            trace.
                        </p>
                    )}
                    {step.evictedLine && (
                        <p className="mt-1">
                            Block {step.evictedLine.blockNumber} was evicted
                            from way {step.wayIndex}.
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}
