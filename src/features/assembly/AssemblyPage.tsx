import type { MachineState } from '../../core/mips/single-cycle/execution/machineState';
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
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className="font-mono text-sm font-bold text-slate-900">
                {value}
            </div>
        </div>
    );
}

export default function AssemblyPage({
    onSendToPipeline,
}: {
    onSendToPipeline?: (source: string, machine: MachineState) => void;
}) {
    const {
        machine,
        machineHighlight,
        programLoaded,
        programIndex,
        programFinished,
        canStepBack,
        handleLoadProgram,
        handleStepInstruction,
        handleStepBack,
        handleResetProgram,
        handleRegisterChange,
        handleResetRegisters,
        handleMemoryChange,
        handleMemoryRangeChange,
        handleResetMemory,
    } = useAssemblySimulator();

    return (
        <main className="min-h-full bg-[#eef2f3] p-3 text-slate-900 sm:p-4 lg:p-6">
            <div className="mx-auto flex max-w-[1480px] flex-col gap-4">
                <header className="rounded-lg border border-slate-200 bg-[#fbfcfd] px-4 py-3 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-950">
                                    MIPS Assembly Simulator
                                </h1>
                                <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                                    {programFinished ? 'Finished' : 'Live'}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
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
                                value={programFinished ? 'DONE' : 'READY'}
                            />
                            <StatusPill label="Mode" value="MIPS" />
                        </div>
                    </div>
                </header>

                <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-4">
                        <MipsEditor
                            onLoad={handleLoadProgram}
                            onSendToPipeline={
                                onSendToPipeline
                                    ? (source) =>
                                          onSendToPipeline(source, machine)
                                    : undefined
                            }
                            programLoaded={programLoaded}
                            programIndex={programIndex}
                            programFinished={programFinished}
                        />

                        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Step Execution
                                </h2>
                                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                                    {programFinished
                                        ? 'Finished'
                                        : `#${programIndex + 1}`}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleStepBack}
                                    disabled={!canStepBack}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Back
                                </button>

                                <button
                                    type="button"
                                    onClick={handleStepInstruction}
                                    disabled={!programLoaded || programFinished}
                                    className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next Instruction
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResetProgram}
                                    disabled={!programLoaded}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Reset
                                </button>
                            </div>

                            {programFinished && (
                                <p className="mt-3 text-xs text-slate-500">
                                    Program finished.
                                </p>
                            )}
                        </section>
                    </aside>

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
        </main>
    );
}
