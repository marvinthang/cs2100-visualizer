import { useMemo } from 'react';
import { summarizeCacheAnalysis } from '../../../core/cache/analysis';
import { validateCacheConfig } from '../../../core/cache/config';
import type { CacheSummary } from '../../../types/cache';
import type { ActiveCacheRun } from '../useCacheRun';
import {
    getArrayBadgeClass,
    getArrayCacheStats,
    type ArrayCacheStats,
} from '../visualizationModel';
import AccessInspector from './AccessInspector';
import CacheVisualization from './CacheVisualization';
import TraceResultsTable from './TraceResultsTable';

function TraceSummary({
    summary,
    arrayStats,
    isStale,
}: {
    summary: CacheSummary;
    arrayStats: ArrayCacheStats[];
    isStale: boolean;
}) {
    const stats = [
        ['Accesses', summary.accessCount],
        ['Hits', summary.hitCount],
        ['Misses', summary.missCount],
    ];

    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="grid gap-5 px-5 py-4 lg:grid-cols-[minmax(240px,0.65fr)_minmax(0,1.35fr)] lg:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                            Hit ratio
                        </span>
                        {isStale && (
                            <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">
                                Inputs changed · run again
                            </span>
                        )}
                    </div>
                    <div className="mt-1 font-mono text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">
                        {summary.hitRate === null
                            ? '—'
                            : `${(summary.hitRate * 100).toFixed(1)}%`}
                    </div>
                </div>

                <div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="bg-emerald-500 transition-[width] duration-500 motion-reduce:transition-none"
                            style={{
                                width: `${(summary.hitRate ?? 0) * 100}%`,
                            }}
                        />
                        <div
                            className="bg-rose-400 transition-[width] duration-500 motion-reduce:transition-none"
                            style={{
                                width: `${summary.hitRate === null ? 0 : (1 - summary.hitRate) * 100}%`,
                            }}
                        />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-800">
                        {stats.map(([label, value]) => (
                            <div
                                key={label}
                                className="bg-slate-50 dark:bg-slate-800 py-2 text-center"
                            >
                                <span className="block font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                                    {value}
                                </span>
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {arrayStats.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800 px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                        By array
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {arrayStats.map((array, index) => (
                            <div
                                key={array.name}
                                className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3 py-2.5"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span
                                        className={`inline-flex rounded px-2 py-1 font-mono text-[10px] font-bold ring-1 ${getArrayBadgeClass(index)}`}
                                    >
                                        {array.name}
                                    </span>
                                    <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                        {array.accessCount}{' '}
                                        {array.accessCount === 1
                                            ? 'access'
                                            : 'accesses'}
                                    </span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded bg-slate-200 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-800">
                                    <div className="flex items-baseline justify-between bg-emerald-50 px-2 py-1.5">
                                        <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                                            Hits
                                        </span>
                                        <span className="font-mono text-sm font-bold text-emerald-800">
                                            {array.hitCount}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline justify-between bg-rose-50 px-2 py-1.5">
                                        <span className="text-[9px] font-semibold uppercase tracking-wide text-rose-700">
                                            Misses
                                        </span>
                                        <span className="font-mono text-sm font-bold text-rose-800">
                                            {array.missCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

function getEmptyTraceMessage(run: ActiveCacheRun): string {
    if (run.sourceMode !== 'mips' || run.mipsTrace === null) {
        return 'The trace contains no addresses, so the cache remains in its initial state.';
    }

    const instructionCount = run.mipsTrace.steps.length;
    if (run.mipsAccessMode === 'read-only') {
        return `${instructionCount} instructions executed, but no lw instruction reached the data cache.`;
    }
    if (run.mipsAccessMode === 'read-write') {
        return `${instructionCount} instructions executed, but no lw or sw instruction reached the data cache.`;
    }
    return `${instructionCount} instructions executed, but no instruction fetch was recorded.`;
}

export default function CacheResults({
    run,
    isStale,
    selectedStepIndex,
    onSelectStep,
}: {
    run: ActiveCacheRun;
    isStale: boolean;
    selectedStepIndex: number;
    onSelectStep: (stepIndex: number) => void;
}) {
    const { analysis, addressFormat, arrayDefinitions, mipsTrace } = run;
    const summary = summarizeCacheAnalysis(analysis);
    const arrayStats = useMemo(
        () => getArrayCacheStats(analysis.simulation.steps, arrayDefinitions),
        [analysis, arrayDefinitions],
    );
    const selectedStep = analysis.simulation.steps[selectedStepIndex] ?? null;
    const previousStep =
        analysis.simulation.steps[selectedStepIndex - 1] ?? null;
    const selectedStepAnalysis = analysis.steps[selectedStepIndex] ?? null;
    const validation = validateCacheConfig(
        analysis.simulation.initialState.config,
    );

    if (!validation.valid) return null;

    const hasSelectedAccess =
        selectedStep !== null && selectedStepAnalysis !== null;

    return (
        <>
            <TraceSummary
                summary={summary}
                arrayStats={arrayStats}
                isStale={isStale}
            />

            {hasSelectedAccess ? (
                <>
                    <section className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
                        <TraceResultsTable
                            analysis={analysis}
                            format={addressFormat}
                            arrayDefinitions={arrayDefinitions}
                            selectedStepIndex={selectedStepIndex}
                            onSelectStep={onSelectStep}
                        />
                        <AccessInspector
                            step={selectedStep}
                            stepAnalysis={selectedStepAnalysis}
                            layout={validation.layout}
                            selectedStepIndex={selectedStepIndex}
                            format={addressFormat}
                        />
                    </section>

                    <CacheVisualization
                        state={selectedStep.stateAfter}
                        activeSetIndex={selectedStep.decomposedAddress.setIndex}
                        activeWayIndex={selectedStep.wayIndex}
                        currentWordIndex={
                            selectedStep.decomposedAddress.blockOffset
                        }
                        previousBlockNumber={
                            previousStep?.decomposedAddress.blockNumber ?? null
                        }
                        previousWordIndex={
                            previousStep?.decomposedAddress.blockOffset ?? null
                        }
                        hit={selectedStep.hit}
                        evictedLine={selectedStep.evictedLine}
                        addressFormat={addressFormat}
                        stepIndex={selectedStepIndex}
                        stepCount={analysis.simulation.steps.length}
                        arrayDefinitions={arrayDefinitions}
                        instructionLayout={
                            selectedStep.access.sourceLine !== undefined &&
                            mipsTrace !== null
                                ? {
                                      baseAddress:
                                          mipsTrace.instructionBaseAddress,
                                      instructionCount:
                                          mipsTrace.instructionCount,
                                  }
                                : null
                        }
                        onStepChange={onSelectStep}
                    />
                </>
            ) : (
                <>
                    <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                            Program completed
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                            No selected cache accesses
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {getEmptyTraceMessage(run)}
                        </p>
                    </section>

                    <CacheVisualization
                        state={analysis.simulation.initialState}
                        activeSetIndex={null}
                        activeWayIndex={null}
                        currentWordIndex={0}
                        previousBlockNumber={null}
                        previousWordIndex={null}
                        hit={false}
                        evictedLine={null}
                        addressFormat={addressFormat}
                        stepIndex={0}
                        stepCount={0}
                        arrayDefinitions={arrayDefinitions}
                        instructionLayout={null}
                        onStepChange={onSelectStep}
                    />
                </>
            )}
        </>
    );
}
