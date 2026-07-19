import { useEffect, useRef } from 'react';
import type { CacheLine, CacheState } from '../../../types/cache';
import type {
    AddressFormat,
    MemoryArrayDefinition,
} from '../../../types/memory';
import CacheLineContents from './CacheLineContents';
import {
    buildVisibleCacheRows,
    getDisplayLruWay,
    scrollCacheSetIntoView,
    type InstructionWordLayout,
} from '../visualizationModel';

export function CacheStepNavigation({
    stepIndex,
    stepCount,
    onStepChange,
}: {
    stepIndex: number;
    stepCount: number;
    onStepChange: (stepIndex: number) => void;
}) {
    const atFirstStep = stepIndex === 0;
    const atLastStep = stepIndex === stepCount - 1;
    const buttonClass =
        'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40';

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                disabled={atFirstStep}
                onClick={() => onStepChange(0)}
                className={`${buttonClass} hidden sm:inline-flex`}
                aria-label="Show first cache access"
            >
                |← First
            </button>
            <button
                type="button"
                disabled={atFirstStep}
                onClick={() => onStepChange(stepIndex - 1)}
                className={buttonClass}
                aria-label="Show previous cache access"
            >
                ← Previous
            </button>
            <span className="min-w-[86px] text-center font-mono text-xs font-semibold text-slate-600">
                Step {stepIndex + 1} / {stepCount}
            </span>
            <button
                type="button"
                disabled={atLastStep}
                onClick={() => onStepChange(stepIndex + 1)}
                className={buttonClass}
                aria-label="Show next cache access"
            >
                Next →
            </button>
            <button
                type="button"
                disabled={atLastStep}
                onClick={() => onStepChange(stepCount - 1)}
                className={`${buttonClass} hidden sm:inline-flex`}
                aria-label="Show last cache access"
            >
                Last →|
            </button>
        </div>
    );
}

function CacheSlot({
    line,
    wayIndex,
    active,
    hit,
    lru,
    state,
    addressFormat,
    currentWordIndex,
    previousBlockNumber,
    previousWordIndex,
    evictedLine,
    arrayDefinitions,
    instructionLayout,
}: {
    line: CacheLine;
    wayIndex: number;
    active: boolean;
    hit: boolean;
    lru: boolean;
    state: CacheState;
    addressFormat: AddressFormat;
    currentWordIndex: number;
    previousBlockNumber: number | null;
    previousWordIndex: number | null;
    evictedLine: CacheLine | null;
    arrayDefinitions: MemoryArrayDefinition[];
    instructionLayout: InstructionWordLayout | null;
}) {
    const activeClass = active
        ? hit
            ? 'border-emerald-400 bg-emerald-50 shadow-[inset_0_0_0_1px_#34d399]'
            : 'border-rose-300 bg-rose-50 shadow-[inset_0_0_0_1px_#fda4af]'
        : line.valid
          ? 'border-slate-200 bg-white'
          : 'border-dashed border-slate-300 bg-slate-50';

    return (
        <div
            className={`relative min-h-[122px] border p-3 transition-colors ${activeClass}`}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Way {wayIndex}
                </span>
                <div className="flex gap-1">
                    {lru && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[8px] font-bold text-amber-700">
                            LRU
                        </span>
                    )}
                    {active && (
                        <span
                            className={`px-1.5 py-0.5 font-mono text-[8px] font-bold text-white ${
                                hit
                                    ? 'rounded bg-emerald-600'
                                    : 'rounded bg-rose-500'
                            }`}
                        >
                            {hit ? 'HIT' : 'LOAD'}
                        </span>
                    )}
                </div>
            </div>

            {line.valid ? (
                <div className="mt-3">
                    <CacheLineContents
                        line={line}
                        config={state.config}
                        addressFormat={addressFormat}
                        arrayDefinitions={arrayDefinitions}
                        instructionLayout={instructionLayout}
                        currentWordIndex={active ? currentWordIndex : null}
                        previousBlockNumber={previousBlockNumber}
                        previousWordIndex={previousWordIndex}
                        evictedLine={evictedLine}
                    />
                </div>
            ) : (
                <p className="mt-5 font-mono text-xs text-slate-400">
                    Invalid / empty
                </p>
            )}
        </div>
    );
}

export default function CacheVisualization({
    state,
    activeSetIndex,
    activeWayIndex,
    currentWordIndex,
    previousBlockNumber,
    previousWordIndex,
    hit,
    evictedLine,
    addressFormat,
    stepIndex,
    stepCount,
    arrayDefinitions,
    instructionLayout,
    onStepChange,
}: {
    state: CacheState;
    activeSetIndex: number | null;
    activeWayIndex: number | null;
    currentWordIndex: number;
    previousBlockNumber: number | null;
    previousWordIndex: number | null;
    hit: boolean;
    evictedLine: CacheLine | null;
    addressFormat: AddressFormat;
    stepIndex: number;
    stepCount: number;
    arrayDefinitions: MemoryArrayDefinition[];
    instructionLayout: InstructionWordLayout | null;
    onStepChange: (stepIndex: number) => void;
}) {
    const wayCount = state.config.wayCount;
    const hasActiveAccess =
        activeSetIndex !== null && activeWayIndex !== null && stepCount > 0;
    const rows = buildVisibleCacheRows(state.sets.length, activeSetIndex ?? 0);
    const activeSetRowRef = useRef<HTMLDivElement>(null);
    const previousStepIndexRef = useRef(stepIndex);

    useEffect(() => {
        if (previousStepIndexRef.current === stepIndex) {
            return;
        }

        previousStepIndexRef.current = stepIndex;
        const activeSetRow = activeSetRowRef.current;
        if (activeSetRow === null) {
            return;
        }

        const reducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ===
                true;
        scrollCacheSetIntoView(activeSetRow, reducedMotion);
    }, [activeSetIndex, stepIndex]);

    return (
        <section className="overflow-clip rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3 text-slate-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {hasActiveAccess
                            ? 'Cache cabinet / state after access'
                            : 'Cache cabinet / initial state'}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900">
                        {hasActiveAccess
                            ? `Address resolves to set ${activeSetIndex}, way ${activeWayIndex}.`
                            : 'No access changed the cache.'}
                    </h2>
                </div>
                {hasActiveAccess && (
                    <CacheStepNavigation
                        stepIndex={stepIndex}
                        stepCount={stepCount}
                        onStepChange={onStepChange}
                    />
                )}
            </div>

            <div className="overflow-x-auto bg-slate-50 p-3">
                <div
                    className="grid min-w-max gap-px overflow-hidden rounded-md bg-slate-200 ring-1 ring-slate-200"
                    role="region"
                    aria-label={
                        hasActiveAccess
                            ? `Cache with ${state.sets.length} sets and ${wayCount} ways. Set ${activeSetIndex}, way ${activeWayIndex} is selected.`
                            : `Empty cache with ${state.sets.length} sets and ${wayCount} ways.`
                    }
                    style={{
                        gridTemplateColumns: `76px repeat(${wayCount}, minmax(420px, 1fr))`,
                    }}
                >
                    <div className="bg-slate-100 p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Set
                    </div>
                    {Array.from({ length: wayCount }, (_, wayIndex) => (
                        <div
                            key={wayIndex}
                            className="bg-slate-100 p-3 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500"
                        >
                            Way {wayIndex}
                        </div>
                    ))}

                    {rows.map((row) => {
                        if (row.kind === 'gap') {
                            return (
                                <div
                                    key={`gap-${row.from}`}
                                    className="col-span-full bg-slate-100 px-3 py-2 text-center font-mono text-[9px] text-slate-500"
                                >
                                    Sets {row.from}–{row.to} collapsed
                                </div>
                            );
                        }

                        const set = state.sets[row.setIndex];
                        const activeSet =
                            hasActiveAccess && row.setIndex === activeSetIndex;
                        const lruWay = getDisplayLruWay(set.ways);

                        return [
                            <div
                                key={`label-${row.setIndex}`}
                                ref={activeSet ? activeSetRowRef : undefined}
                                className={`scroll-mt-24 flex items-center justify-center p-3 font-mono text-sm font-bold ${
                                    activeSet
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-50 text-slate-900'
                                }`}
                            >
                                S{row.setIndex}
                            </div>,
                            ...set.ways.map((line, wayIndex) => (
                                <CacheSlot
                                    key={`set-${row.setIndex}-way-${wayIndex}`}
                                    line={line}
                                    wayIndex={wayIndex}
                                    active={
                                        activeSet && wayIndex === activeWayIndex
                                    }
                                    hit={hit}
                                    lru={wayIndex === lruWay}
                                    state={state}
                                    addressFormat={addressFormat}
                                    currentWordIndex={currentWordIndex}
                                    previousBlockNumber={previousBlockNumber}
                                    previousWordIndex={previousWordIndex}
                                    evictedLine={
                                        activeSet && wayIndex === activeWayIndex
                                            ? evictedLine
                                            : null
                                    }
                                    arrayDefinitions={arrayDefinitions}
                                    instructionLayout={instructionLayout}
                                />
                            )),
                        ];
                    })}
                </div>
            </div>
        </section>
    );
}
