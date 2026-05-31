import MemoryTable from '../datapath/components/MemoryTable';
import RegisterTable from '../datapath/components/RegisterTable';
import MipsEditor from './MipsEditor';
import { useAssemblySimulator } from './useAssemblySimulator';

export default function AssemblyPage() {
    const {
        machine,
        machineHighlight,
        programLoaded,
        programIndex,
        programFinished,
        handleLoadProgram,
        handleStepInstruction,
        handleResetProgram,
        handleRegisterChange,
        handleResetRegisters,
        handleMemoryChange,
        handleMemoryRangeChange,
        handleResetMemory,
    } = useAssemblySimulator();

    return (
        <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
            <div className="mx-auto max-w-[1400px]">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold">
                        MIPS Assembly Simulator
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Write a program and execute it one instruction at a
                        time, watching registers and memory update.
                    </p>
                </header>

                <div className="grid items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
                    <aside className="space-y-4">
                        <MipsEditor
                            onLoad={handleLoadProgram}
                            programLoaded={programLoaded}
                            programIndex={programIndex}
                            programFinished={programFinished}
                        />

                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleStepInstruction}
                                    disabled={!programLoaded || programFinished}
                                    className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next Instruction
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResetProgram}
                                    disabled={!programLoaded}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
