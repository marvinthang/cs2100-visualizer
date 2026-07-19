import { useState } from 'react';
import MipsArrayDefinitionsEditor from '../../components/MipsArrayDefinitionsEditor';
import { prepareMipsArrays } from '../../core/mips/execution/prepareMipsArrays';
import type { MachineState } from '../../core/mips/single-cycle/execution/machineState';
import type { MipsArrayDefinitionDraft } from '../../types/mips';
import MemoryTable from '../datapath/components/MemoryTable';
import RegisterTable from '../datapath/components/RegisterTable';
import MipsEditor from './MipsEditor';
import { useAssemblySimulator } from './useAssemblySimulator';

function StatusPill({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                {label}
            </div>
            <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                {value}
            </div>
        </div>
    );
}

export default function AssemblyPage({
    arrayDefinitions,
    onArrayDefinitionsChange,
    onSendToPipeline,
    onSendToCache,
}: {
    arrayDefinitions: MipsArrayDefinitionDraft[];
    onArrayDefinitionsChange: (definitions: MipsArrayDefinitionDraft[]) => void;
    onSendToPipeline?: (
        source: string,
        machine: MachineState,
        arrays: MipsArrayDefinitionDraft[],
    ) => void;
    onSendToCache?: (
        source: string,
        machine: MachineState,
        arrays: MipsArrayDefinitionDraft[],
    ) => void;
}) {
    const [arrayErrors, setArrayErrors] = useState<string[]>([]);
    const {
        machine,
        machineHighlight,
        programLoaded,
        programIndex,
        programFinished,
        canStepBack,
        breakpoints,
        toggleBreakpoint,
        handleLoadProgram,
        handleStepInstruction,
        handleRunToBreakpoint,
        handleStepBack,
        handleResetProgram,
        handleRegisterChange,
        handleResetRegisters,
        handleMemoryChange,
        handleMemoryRangeChange,
        handleResetMemory,
    } = useAssemblySimulator();

    const assemblyState = !programLoaded
        ? 'Idle'
        : programFinished
          ? 'Finished'
          : 'Ready';

    function loadProgram(source: string) {
        const prepared = prepareMipsArrays(machine, arrayDefinitions);
        setArrayErrors(prepared.errors);
        if (prepared.errors.length > 0) return;

        handleLoadProgram(source, prepared.machine);
    }

    return (
        <main className="min-h-full bg-[#eef2f3] dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 sm:p-4 lg:p-6">
            <div className="mx-auto flex max-w-[1480px] flex-col gap-4">
                <header className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/60 px-4 py-3 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                                    MIPS Assembly Simulator
                                </h1>
                                <span className="rounded-md bg-slate-900 dark:bg-slate-600 px-2 py-1 text-xs font-semibold text-white dark:text-white">
                                    {assemblyState}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Write a program and execute it one instruction
                                at a time, watching registers and memory update.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                            <StatusPill
                                label="Loaded"
                                value={programLoaded ? 'YES' : 'NO'}
                            />
                            <StatusPill
                                label="Index"
                                value={programLoaded ? programIndex + 1 : 0}
                            />
                            <StatusPill
                                label="State"
                                value={assemblyState.toUpperCase()}
                            />
                            <StatusPill label="Mode" value="MIPS" />
                        </div>
                    </div>
                </header>

                <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-4">
                        <MipsEditor
                            onLoad={loadProgram}
                            onSendToPipeline={
                                onSendToPipeline
                                    ? (source) =>
                                          onSendToPipeline(
                                              source,
                                              machine,
                                              arrayDefinitions,
                                          )
                                    : undefined
                            }
                            onSendToCache={
                                onSendToCache
                                    ? (source) =>
                                          onSendToCache(
                                              source,
                                              machine,
                                              arrayDefinitions,
                                          )
                                    : undefined
                            }
                            programLoaded={programLoaded}
                            programIndex={programIndex}
                            programFinished={programFinished}
                            breakpoints={breakpoints}
                            onToggleBreakpoint={toggleBreakpoint}
                            onStep={handleStepInstruction}
                            onRunToBreakpoint={handleRunToBreakpoint}
                            onBack={handleStepBack}
                            onReset={handleResetProgram}
                            canStepBack={canStepBack}
                        />
                    </aside>

                    <div className="space-y-4">
                        <MipsArrayDefinitionsEditor
                            definitions={arrayDefinitions}
                            errors={arrayErrors}
                            onChange={(definitions) => {
                                setArrayErrors([]);
                                onArrayDefinitionsChange(definitions);
                            }}
                        />

                        <div className="grid items-start gap-4 md:grid-cols-2">
                            <RegisterTable
                                machine={machine}
                                onRegisterChange={handleRegisterChange}
                                onResetRegisters={handleResetRegisters}
                                machineHighlight={machineHighlight}
                                tableMaxHeightClass="max-h-[480px]"
                            />

                            <MemoryTable
                                machine={machine}
                                onMemoryChange={handleMemoryChange}
                                onMemoryRangeChange={handleMemoryRangeChange}
                                onResetMemory={handleResetMemory}
                                machineHighlight={machineHighlight}
                                tableMaxHeightClass="max-h-[420px]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
