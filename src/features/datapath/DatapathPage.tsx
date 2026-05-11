import { useState } from 'react';
import { datapathMnemonics } from '../../core/mips-datapath/instruction/instructionSet';
import ControlSignalTable from './components/ControlSignalTable';
import DatapathDiagram from './components/DatapathDiagram';
import StepControls from './components/StepControls';
import RegisterTable from './components/RegisterTable';
import MemoryTable from './components/MemoryTable';
import DatapathValueTable from './components/DatapathValueTable';
import { type DatapathSimulatorMode, useDatapathSimulator } from './hooks/useDatapathSimulator';
import type { DatapathMnemonic } from '../../types/mips';

export default function DatapathPage() {
    const simulator = useDatapathSimulator();
    const [isEditingSignals, setIsEditingSignals] = useState(false);

    const {
        mnemonic,
        setMnemonic,
        defaultSignals,
        signals,
        mode,
        handleModeChange,
        machine,
        currentContext,
        warnings,
        bits,
        currentStep,
        isFirstStep,
        isLastStep,
        defaultActiveSegments,
        currentActiveSegments,
        modifiedActiveSegments,
        datapathHighlight,
        machineHighlight,
        handleSignalsChange,
        handleRegisterChange,
        handleMemoryChange,
        handleMemoryRangeChange,
        handleResetRegisters,
        handleResetMemory,
        handlePreviousStep,
        handleNextStep,
        handleResetStep,
        resetControlSignals,
    } = simulator;

    const logs = currentContext.logs ?? [];

    return (
        <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
            <div className="mx-auto max-w-[1900px]">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold">MIPS Datapath Visualizer</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Explore control signals, datapath flow, and step-by-step execution.
                    </p>
                </header>

                <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_270px] 2xl:grid-cols-[280px_minmax(0,1fr)_300px]">
                    <aside className="space-y-4 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:overflow-y-auto">
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold text-slate-900">
                                Instruction Setup
                            </h2>

                            <div className="grid grid-cols-[80px_minmax(0,1fr)] items-end gap-4">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-600">
                                        Instruction
                                    </span>

                                    <select
                                        value={mnemonic}
                                        onChange={(event) =>
                                            setMnemonic(event.target.value as DatapathMnemonic)
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    >
                                        {datapathMnemonics.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-600">
                                        Mode
                                    </span>

                                    <select
                                        value={mode}
                                        onChange={(event) => {
                                            handleModeChange(
                                                event.target.value as DatapathSimulatorMode,
                                            );
                                        }}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    >
                                        <option value="explore">Explore</option>
                                        <option value="simulate">Simulate</option>
                                    </select>
                                </label>
                            </div>
                        </section>

                        <StepControls
                            step={currentStep}
                            isFirstStep={isFirstStep}
                            isLastStep={isLastStep}
                            onPreviousStep={handlePreviousStep}
                            onNextStep={handleNextStep}
                            onResetStep={handleResetStep}
                        />

                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Control Signals
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setIsEditingSignals((value) => !value)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    {isEditingSignals ? 'Lock' : 'Edit'}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={resetControlSignals}
                                className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Reset Control Signals
                            </button>

                            <ControlSignalTable
                                signals={signals}
                                defaultSignals={defaultSignals}
                                onChange={handleSignalsChange}
                                editable={isEditingSignals}
                                datapathHighlight={datapathHighlight}
                            />
                        </section>
                    </aside>

                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:h-[calc(100vh-3rem)]">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-900">
                                Datapath Diagram
                            </h2>

                            <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-600">
                                {currentStep ?? 'FULL'}
                            </span>
                        </div>

                        <div className="h-[calc(100%-2.25rem)] overflow-auto rounded-xl border border-slate-200 bg-white">
                            <DatapathDiagram
                                bits={bits}
                                defaultActiveSegments={defaultActiveSegments}
                                currentActiveSegments={currentActiveSegments}
                                modifiedActiveSegments={modifiedActiveSegments}
                                defaultSignals={defaultSignals}
                                signals={signals}
                                datapathHighlight={datapathHighlight}
                            />
                        </div>
                    </section>

                    <aside className="space-y-4 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:overflow-y-auto">
                        <DatapathValueTable
                            context={currentContext}
                            datapathHighlight={datapathHighlight}
                        />

                        <RegisterTable
                            machine={machine}
                            onRegisterChange={handleRegisterChange}
                            onResetRegisters={handleResetRegisters}
                            machineHighlight={machineHighlight}
                        />

                        <MemoryTable
                            machine={machine}
                            onMemoryChange={handleMemoryChange}
                            onMemoryRangeChange={handleMemoryRangeChange}
                            onResetMemory={handleResetMemory}
                            machineHighlight={machineHighlight}
                        />

                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Execution Log
                                </h2>

                                <span className="text-xs text-slate-500">
                                    {warnings.length} warning
                                    {warnings.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs">
                                {logs.length === 0 && warnings.length === 0 && (
                                    <p className="text-slate-500">
                                        No execution logs yet.
                                    </p>
                                )}

                                {logs.map((log, index) => (
                                    <p
                                        key={`log-${index}`}
                                        className="whitespace-pre text-slate-200"
                                    >
                                        {log}
                                    </p>
                                ))}

                                {warnings.length > 0 && (
                                    <div className="mt-3 border-t border-slate-700 pt-3">
                                        {warnings.map((warning, index) => (
                                            <p
                                                key={`warning-${index}`}
                                                className="whitespace-pre text-red-300"
                                            >
                                                {warning}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}