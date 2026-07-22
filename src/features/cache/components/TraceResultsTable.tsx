import { getArrayElementLabel } from '../../../core/cache/arrayTrace';
import type { CacheAnalysis } from '../../../types/cache';
import type {
    AddressFormat,
    MemoryArrayDefinition,
} from '../../../types/memory';
import { formatAddress, formatHex } from '../format';
import { getArrayBadgeClass } from '../visualizationModel';

const MAX_VISIBLE_TRACE_ROWS = 201;

function getTraceResultsWindow(
    totalRows: number,
    selectedIndex: number,
    maxVisibleRows = MAX_VISIBLE_TRACE_ROWS,
) {
    const safeTotal = Math.max(0, Math.trunc(totalRows));
    const safeLimit = Math.max(1, Math.trunc(maxVisibleRows));

    if (safeTotal <= safeLimit) {
        return { startIndex: 0, endIndex: safeTotal, windowed: false };
    }

    const safeSelectedIndex = Math.min(
        Math.max(0, Math.trunc(selectedIndex)),
        safeTotal - 1,
    );
    const rowsBeforeSelection = Math.floor(safeLimit / 2);
    let startIndex = Math.max(0, safeSelectedIndex - rowsBeforeSelection);
    const endIndex = Math.min(safeTotal, startIndex + safeLimit);

    startIndex = Math.max(0, endIndex - safeLimit);

    return {
        startIndex,
        endIndex: startIndex + safeLimit,
        windowed: true,
    };
}

export default function TraceResultsTable({
    analysis,
    format,
    arrayDefinitions,
    selectedStepIndex,
    onSelectStep,
}: {
    analysis: CacheAnalysis;
    format: AddressFormat;
    arrayDefinitions: MemoryArrayDefinition[];
    selectedStepIndex: number;
    onSelectStep: (index: number) => void;
}) {
    const showsSourceLines = analysis.simulation.steps.some(
        (step) => step.access.sourceLine !== undefined,
    );
    const traceWindow = getTraceResultsWindow(
        analysis.simulation.steps.length,
        selectedStepIndex,
    );
    const visibleSteps = analysis.simulation.steps.slice(
        traceWindow.startIndex,
        traceWindow.endIndex,
    );

    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-[#fbfcfd] px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Select an access to inspect it
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Dynamic cache-access trace
                </p>
            </div>

            {traceWindow.windowed && (
                <p
                    className="border-b border-slate-200 bg-slate-50 px-4 py-2 font-mono text-[10px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
                    aria-live="polite"
                >
                    Showing {traceWindow.startIndex + 1}–{traceWindow.endIndex}{' '}
                    of {analysis.simulation.steps.length} accesses
                </p>
            )}

            <div className="max-h-[620px] overflow-auto">
                <table className="w-full min-w-[1040px] border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 font-mono text-[9px] uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        <tr>
                            {[
                                '#',
                                'Address',
                                'Block',
                                'Tag',
                                'Set',
                                'Word',
                                'Source',
                                showsSourceLines ? 'Line' : 'Operation',
                                'Verdict',
                                'Reading',
                            ].map((heading) => (
                                <th
                                    key={heading}
                                    className="px-3 py-3 font-bold"
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {visibleSteps.map((step, visibleIndex) => {
                            const index = traceWindow.startIndex + visibleIndex;
                            const rowAnalysis = analysis.steps[index];
                            const selected = selectedStepIndex === index;
                            const arrayLabel = getArrayElementLabel(
                                step.access.address,
                                arrayDefinitions,
                            );
                            const sourceLabel =
                                step.access.label === arrayLabel
                                    ? null
                                    : step.access.label;
                            const arrayIndex = arrayDefinitions.findIndex(
                                (arrayDefinition) =>
                                    arrayLabel?.startsWith(
                                        `${arrayDefinition.name}[`,
                                    ),
                            );
                            const arrayLabelClass =
                                getArrayBadgeClass(arrayIndex);

                            return (
                                <tr
                                    key={step.access.ordinal}
                                    tabIndex={0}
                                    aria-selected={selected}
                                    onClick={() => onSelectStep(index)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            onSelectStep(index);
                                        }
                                    }}
                                    className={`cursor-pointer outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 ${
                                        selected
                                            ? 'bg-sky-50 shadow-[inset_3px_0_0_#0f172a] dark:bg-slate-600 dark:text-white'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <td className="px-3 py-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                                        {index + 1}
                                    </td>
                                    <td className="px-3 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                                        {formatAddress(
                                            step.access.address,
                                            format,
                                        )}
                                    </td>
                                    <td className="px-3 py-3 font-mono">
                                        {step.decomposedAddress.blockNumber}
                                    </td>
                                    <td className="px-3 py-3 font-mono">
                                        {formatHex(step.decomposedAddress.tag)}
                                    </td>
                                    <td className="px-3 py-3 font-mono">
                                        {step.decomposedAddress.setIndex}
                                    </td>
                                    <td className="px-3 py-3 font-mono">
                                        {step.decomposedAddress.blockOffset}
                                    </td>
                                    <td className="px-3 py-3">
                                        {sourceLabel || arrayLabel ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {sourceLabel && (
                                                    <span className="inline-flex rounded bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                                                        {sourceLabel}
                                                    </span>
                                                )}
                                                {arrayLabel && (
                                                    <span
                                                        data-array-index={
                                                            arrayIndex
                                                        }
                                                        className={`inline-flex rounded px-2 py-1 font-mono text-[10px] font-semibold ring-1 ${arrayLabelClass}`}
                                                    >
                                                        {arrayLabel}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="font-mono text-slate-400 dark:text-slate-400">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        {step.access.sourceLine !==
                                        undefined ? (
                                            <span className="inline-flex whitespace-nowrap rounded bg-sky-100 px-2 py-1 font-mono text-[10px] font-bold text-sky-800">
                                                Line {step.access.sourceLine}
                                            </span>
                                        ) : (
                                            <span
                                                className={`inline-flex px-2 py-1 font-mono text-[10px] font-bold uppercase ${
                                                    step.access.operation ===
                                                    'write'
                                                        ? 'rounded bg-rose-100 text-rose-700'
                                                        : 'rounded bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                {step.access.operation}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span
                                            className={`inline-flex min-w-12 justify-center px-2 py-1 font-mono text-[10px] font-bold uppercase ${
                                                step.hit
                                                    ? 'rounded bg-emerald-100 text-emerald-700'
                                                    : 'rounded bg-rose-100 text-rose-700'
                                            }`}
                                        >
                                            {step.hit ? 'Hit' : 'Miss'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 capitalize text-slate-600 dark:text-slate-400">
                                        {rowAnalysis.missType ??
                                            rowAnalysis.locality ??
                                            '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
