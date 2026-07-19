import { useMemo, useState } from 'react';
import { validateCacheConfig } from '../../core/cache/config';
import { parseAddressTrace } from '../../core/cache/addressTrace';
import type { CacheConfig } from '../../types/cache';
import type { AddressFormat } from '../../types/memory';
import {
    parseArrayTraceDraft,
    type ArrayTraceDraft,
    type CacheTraceSourceMode,
} from './arrayTraceDraft';
import ArrayTraceInputPanel from './components/array/ArrayTraceInputPanel';
import CacheGeometryPanel from './components/CacheGeometryPanel';
import CacheResults from './components/CacheResults';
import ManualTraceInputPanel from './components/ManualTraceInputPanel';
import TraceSourceSwitch from './components/TraceSourceSwitch';
import MipsTraceInputPanel from './components/MipsTraceInputPanel';
import { generateArrayTrace } from '../../core/cache/arrayTrace';
import type { MachineState } from '../../core/mips/single-cycle/execution/machineState';
import {
    buildMipsCacheTrace,
    parseInstructionBaseAddress,
    selectMipsCacheAccesses,
    type MipsCacheAccessMode,
} from '../../core/cache/mipsTrace';
import { prepareMipsArrays } from '../../core/mips/execution/prepareMipsArrays';
import type { MipsArrayDefinitionDraft } from '../../types/mips';
import { formatAddress } from './format';
import { useCacheRun } from './useCacheRun';

function CacheErrors({ errors }: { errors: string[] }) {
    if (errors.length === 0) return null;

    return (
        <section
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-4 shadow-sm"
        >
            <p className="text-xs font-semibold text-rose-800">Trace stopped</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                {errors.map((error, index) => (
                    <li key={`${index}-${error}`}>{error}</li>
                ))}
            </ul>
        </section>
    );
}

function CacheHero() {
    return (
        <header className="rounded-lg border border-slate-200 bg-[#fbfcfd] px-4 py-3 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-slate-950">
                            Cache Visualizer
                        </h1>
                        <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                            Data + instruction
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Run an address trace and inspect its tag, set, word,
                        hits, misses, and replacements one access at a time.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                        ['Address', '32-bit'],
                        ['Word', '4 bytes'],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm"
                        >
                            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                {label}
                            </span>
                            <span className="font-mono text-sm font-bold text-slate-900">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </header>
    );
}

export default function CachePage({
    program,
    onProgramChange,
    initialMachine,
    onInitialMachineChange,
    arrayDefinitions,
    onArrayDefinitionsChange,
}: {
    program: string;
    onProgramChange: (next: string) => void;
    initialMachine: MachineState;
    onInitialMachineChange: (next: MachineState) => void;
    arrayDefinitions: MipsArrayDefinitionDraft[];
    onArrayDefinitionsChange: (definitions: MipsArrayDefinitionDraft[]) => void;
}) {
    const [traceSourceMode, setTraceSourceMode] =
        useState<CacheTraceSourceMode>(
            program.trim() === '' ? 'manual' : 'mips',
        );
    const [mipsAccessMode, setMipsAccessMode] =
        useState<MipsCacheAccessMode>('read-write');
    const [instructionBaseAddress, setInstructionBaseAddress] =
        useState('0x00400000');
    const [instructionAddressFormat, setInstructionAddressFormat] =
        useState<AddressFormat>('hexadecimal');
    const [capacityWords, setCapacityWords] = useState('16');
    const [blockSizeWords, setBlockSizeWords] = useState('4');
    const [wayCount, setWayCount] = useState('1');
    const [format, setFormat] = useState<AddressFormat>('hexadecimal');
    const [source, setSource] = useState('0 4 8 0');

    const draftConfig = useMemo<CacheConfig>(
        () => ({
            addressBits: 32,
            wordSizeBytes: 4,
            capacityBytes: Number(capacityWords) * 4,
            blockSizeBytes: Number(blockSizeWords) * 4,
            wayCount: Number(wayCount),
        }),
        [blockSizeWords, capacityWords, wayCount],
    );

    const draftValidation = useMemo(
        () => validateCacheConfig(draftConfig),
        [draftConfig],
    );

    const {
        activeRun,
        errors,
        isStale,
        selectedStepIndex,
        markDraftChanged,
        reportErrors,
        runAccesses,
        setSelectedStepIndex,
    } = useCacheRun(draftConfig);

    function handleMipsRun() {
        const prepared = prepareMipsArrays(initialMachine, arrayDefinitions);

        if (prepared.errors.length > 0) {
            reportErrors(prepared.errors);
            return;
        }

        const parsedInstructionBaseAddress = parseInstructionBaseAddress(
            instructionBaseAddress,
            instructionAddressFormat,
        );

        if (
            mipsAccessMode === 'instruction' &&
            parsedInstructionBaseAddress === null
        ) {
            reportErrors([
                `First instruction address must be a word-aligned 32-bit ${instructionAddressFormat} address.`,
            ]);
            return;
        }

        const trace = buildMipsCacheTrace(
            program,
            prepared.machine,
            undefined,
            parsedInstructionBaseAddress ?? 0x00400000,
        );

        if (trace.errors.length > 0) {
            reportErrors(
                trace.errors.map(
                    (error) => `Line ${error.line}: ${error.message}`,
                ),
            );
            return;
        }

        const ran = runAccesses(
            selectMipsCacheAccesses(trace, mipsAccessMode),
            {
                sourceMode: 'mips',
                addressFormat: format,
                arrayDefinitions:
                    mipsAccessMode === 'instruction'
                        ? []
                        : prepared.definitions,
                mipsTrace: trace,
                mipsAccessMode,
            },
        );

        if (ran) onInitialMachineChange(prepared.machine);
    }

    function updateFormat(value: AddressFormat) {
        setFormat(value);
        markDraftChanged();
    }

    function updateSource(value: string) {
        setSource(value);
        markDraftChanged();
    }

    function updateCapacity(value: string) {
        setCapacityWords(value);
        markDraftChanged();
    }

    function updateBlockSize(value: string) {
        setBlockSizeWords(value);
        markDraftChanged();
    }

    function updateWayCount(value: string) {
        setWayCount(value);
        markDraftChanged();
    }

    function updateTraceSourceMode(value: CacheTraceSourceMode) {
        if (value === traceSourceMode) return;

        setTraceSourceMode(value);
        markDraftChanged();
    }

    function updateMipsAccessMode(value: MipsCacheAccessMode) {
        setMipsAccessMode(value);
        markDraftChanged();
    }

    function updateInstructionBaseAddress(value: string) {
        setInstructionBaseAddress(value);
        markDraftChanged();
    }

    function updateInstructionAddressFormat(value: AddressFormat) {
        const parsedAddress = parseInstructionBaseAddress(
            instructionBaseAddress,
            instructionAddressFormat,
        );

        setInstructionAddressFormat(value);
        if (parsedAddress !== null) {
            setInstructionBaseAddress(formatAddress(parsedAddress, value));
        }
        markDraftChanged();
    }

    function handleManualRun() {
        const parsed = parseAddressTrace(source, format);

        if (parsed.errors.length > 0) {
            reportErrors(parsed.errors);
            return;
        }

        runAccesses(parsed.accesses, {
            sourceMode: 'manual',
            addressFormat: format,
            arrayDefinitions: [],
            mipsTrace: null,
            mipsAccessMode: null,
        });
    }

    function handleArrayRun(draft: ArrayTraceDraft) {
        const parsed = parseArrayTraceDraft(draft);

        if (parsed.errors.length > 0 || parsed.loop === null) {
            reportErrors(parsed.errors);
            return;
        }

        const { accesses, errors: traceErrors } = generateArrayTrace(
            parsed.definitions,
            parsed.patterns,
            parsed.loop,
        );

        if (traceErrors.length > 0) {
            reportErrors(traceErrors);
            return;
        }

        runAccesses(accesses, {
            sourceMode: 'array',
            addressFormat: draft.format,
            arrayDefinitions: parsed.definitions,
            mipsTrace: null,
            mipsAccessMode: null,
        });
    }

    return (
        <main className="min-h-full bg-[#eef2f3] p-3 text-slate-900 sm:p-4 lg:p-6">
            <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-4">
                <CacheHero />

                <TraceSourceSwitch
                    value={traceSourceMode}
                    onChange={updateTraceSourceMode}
                />

                <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
                    <div className="min-w-0">
                        <div
                            className={
                                traceSourceMode === 'manual' ? '' : 'hidden'
                            }
                        >
                            <ManualTraceInputPanel
                                format={format}
                                source={source}
                                onFormatChange={updateFormat}
                                onSourceChange={updateSource}
                                onRun={handleManualRun}
                            />
                        </div>
                        <div
                            className={
                                traceSourceMode === 'array' ? '' : 'hidden'
                            }
                        >
                            <ArrayTraceInputPanel
                                format={format}
                                onFormatChange={updateFormat}
                                onDraftChange={markDraftChanged}
                                onRun={handleArrayRun}
                            />
                        </div>
                        <div
                            className={
                                traceSourceMode === 'mips' ? '' : 'hidden'
                            }
                        >
                            <MipsTraceInputPanel
                                program={program}
                                traceTruncated={
                                    activeRun?.sourceMode === 'mips' &&
                                    activeRun.mipsTrace?.truncated === true
                                }
                                initialMachine={initialMachine}
                                arrayDefinitions={arrayDefinitions}
                                accessMode={mipsAccessMode}
                                instructionBaseAddress={instructionBaseAddress}
                                instructionAddressFormat={
                                    instructionAddressFormat
                                }
                                onProgramChange={(next) => {
                                    onProgramChange(next);
                                    markDraftChanged();
                                }}
                                onInitialMachineChange={(next) => {
                                    onInitialMachineChange(next);
                                    markDraftChanged();
                                }}
                                onArrayDefinitionsChange={(next) => {
                                    onArrayDefinitionsChange(next);
                                    markDraftChanged();
                                }}
                                onAccessModeChange={updateMipsAccessMode}
                                onInstructionBaseAddressChange={
                                    updateInstructionBaseAddress
                                }
                                onInstructionAddressFormatChange={
                                    updateInstructionAddressFormat
                                }
                                onRun={handleMipsRun}
                            />
                        </div>
                    </div>
                    <CacheGeometryPanel
                        config={draftConfig}
                        validation={draftValidation}
                        capacityWords={capacityWords}
                        blockSizeWords={blockSizeWords}
                        wayCount={wayCount}
                        onCapacityChange={updateCapacity}
                        onBlockSizeChange={updateBlockSize}
                        onWayCountChange={updateWayCount}
                    />
                </section>

                <CacheErrors errors={errors} />

                {activeRun && (
                    <CacheResults
                        run={activeRun}
                        isStale={isStale}
                        selectedStepIndex={selectedStepIndex}
                        onSelectStep={setSelectedStepIndex}
                    />
                )}
            </div>
        </main>
    );
}
