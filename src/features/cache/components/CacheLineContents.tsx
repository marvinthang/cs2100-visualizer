import type { CacheConfig, CacheLine } from '../../../types/cache';
import type {
    AddressFormat,
    MemoryArrayDefinition,
} from '../../../types/memory';
import { formatAddress, formatHex } from '../format';
import {
    getCacheLineWordAddresses,
    getInstructionWordLabel,
    type InstructionWordLayout,
} from '../visualizationModel';
import { getArrayElementLabel } from '../../../core/cache/arrayTrace';

function CacheWords({
    line,
    config,
    addressFormat,
    arrayDefinitions,
    instructionLayout,
    currentWordIndex,
    previousBlockNumber,
    previousWordIndex,
    evictedLine,
}: {
    line: CacheLine;
    config: CacheConfig;
    addressFormat: AddressFormat;
    arrayDefinitions: MemoryArrayDefinition[];
    instructionLayout: InstructionWordLayout | null;
    currentWordIndex: number | null;
    previousBlockNumber: number | null;
    previousWordIndex: number | null;
    evictedLine: CacheLine | null;
}) {
    const wordAddresses = getCacheLineWordAddresses(line, config);
    const evictedWordAddresses = evictedLine
        ? getCacheLineWordAddresses(evictedLine, config)
        : [];

    return (
        <div className="flex w-max gap-1.5">
            {wordAddresses.map((address, wordIndex) => {
                const current = wordIndex === currentWordIndex;
                const previous =
                    line.blockNumber === previousBlockNumber &&
                    wordIndex === previousWordIndex;
                const evictedPrevious =
                    evictedLine?.blockNumber === previousBlockNumber &&
                    wordIndex === previousWordIndex;
                const label =
                    getArrayElementLabel(address, arrayDefinitions) ??
                    getInstructionWordLabel(address, instructionLayout);
                const evictedAddress = evictedWordAddresses[wordIndex];
                const evictedLabel =
                    evictedAddress === undefined
                        ? null
                        : (getArrayElementLabel(
                              evictedAddress,
                              arrayDefinitions,
                          ) ??
                          getInstructionWordLabel(
                              evictedAddress,
                              instructionLayout,
                          ));

                return (
                    <div
                        key={address}
                        data-word-index={wordIndex}
                        data-current={current ? 'true' : undefined}
                        data-previous={
                            previous || evictedPrevious ? 'true' : undefined
                        }
                        className={`relative min-w-[92px] flex-1 border px-2 py-2 ${
                            current
                                ? 'border-sky-400 bg-sky-100 shadow-[inset_0_0_0_1px_#38bdf8]'
                                : previous
                                  ? 'border-amber-300 bg-amber-50 shadow-[inset_0_0_0_1px_#fcd34d]'
                                  : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                Word {wordIndex}
                            </span>
                            {!evictedLine && (
                                <div className="flex gap-0.5">
                                    {previous && (
                                        <span className="rounded bg-amber-500 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                                            Prev
                                        </span>
                                    )}
                                    {current && (
                                        <span className="rounded bg-slate-900 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white">
                                            Current
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {evictedAddress !== undefined && (
                            <div
                                data-word-state="evicted"
                                className={`mt-1.5 border-l-2 px-1.5 py-1 ${
                                    evictedPrevious
                                        ? 'border-amber-400 bg-amber-50'
                                        : 'border-rose-400 bg-rose-50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-[7px] font-bold uppercase tracking-wider text-rose-700">
                                        Evicted
                                    </span>
                                    {evictedPrevious && (
                                        <span className="rounded bg-amber-500 px-1 py-0.5 text-[7px] font-bold uppercase text-white">
                                            Prev
                                        </span>
                                    )}
                                </div>
                                {evictedLabel && (
                                    <span className="mt-0.5 block text-[9px] font-bold text-rose-700">
                                        {evictedLabel}
                                    </span>
                                )}
                                <span className="mt-0.5 block text-[9px] font-bold text-rose-700">
                                    {formatAddress(
                                        evictedAddress,
                                        addressFormat,
                                    )}
                                </span>
                            </div>
                        )}

                        <div
                            data-word-state={evictedLine ? 'loaded' : undefined}
                            className={
                                evictedLine
                                    ? 'mt-1 border-l-2 border-emerald-400 bg-emerald-50 px-1.5 py-1'
                                    : ''
                            }
                        >
                            {evictedLine && (
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-[7px] font-bold uppercase tracking-wider text-emerald-700">
                                        Loaded
                                    </span>
                                    {current && (
                                        <span className="rounded bg-slate-900 px-1 py-0.5 text-[7px] font-bold uppercase text-white">
                                            Current
                                        </span>
                                    )}
                                </div>
                            )}
                            {label && (
                                <span className="mt-1 block text-[10px] font-bold text-emerald-700">
                                    {label}
                                </span>
                            )}
                            <span
                                className={`block text-[10px] font-bold text-slate-900 ${
                                    label ? 'mt-0.5' : 'mt-1'
                                }`}
                            >
                                {formatAddress(address, addressFormat)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function CacheLineContents({
    line,
    config,
    addressFormat,
    currentWordIndex,
    previousBlockNumber,
    previousWordIndex,
    arrayDefinitions,
    instructionLayout,
    evictedLine,
}: {
    line: CacheLine;
    config: CacheConfig;
    addressFormat: AddressFormat;
    currentWordIndex: number | null;
    previousBlockNumber: number | null;
    previousWordIndex: number | null;
    arrayDefinitions: MemoryArrayDefinition[];
    instructionLayout: InstructionWordLayout | null;
    evictedLine: CacheLine | null;
}) {
    return (
        <div className="grid min-w-0 grid-cols-[112px_minmax(0,1fr)] gap-3 font-mono">
            <div className="border-r border-slate-200 pr-3">
                <div className="grid gap-3">
                    <div>
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                            Tag
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                            {formatHex(line.tag)}
                        </span>
                    </div>
                    <div>
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                            Block
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                            #{line.blockNumber}
                        </span>
                    </div>
                </div>
            </div>

            <div className="min-w-0">
                <p className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {evictedLine
                        ? 'Words replaced in place · byte addresses'
                        : 'Words in block · byte addresses'}
                </p>
                <div className="overflow-x-auto pb-1">
                    <CacheWords
                        line={line}
                        config={config}
                        addressFormat={addressFormat}
                        arrayDefinitions={arrayDefinitions}
                        instructionLayout={instructionLayout}
                        currentWordIndex={currentWordIndex}
                        previousBlockNumber={previousBlockNumber}
                        previousWordIndex={previousWordIndex}
                        evictedLine={evictedLine}
                    />
                </div>
            </div>
        </div>
    );
}
