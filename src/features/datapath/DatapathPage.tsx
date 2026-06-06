import { useState } from 'react';
import { datapathMnemonics } from '../../core/mips/instruction/instructionSet';
import AssemblyEditor from './components/AssemblyEditor';
import ControlSignalTable from './components/ControlSignalTable';
import DatapathDiagram from './components/DatapathDiagram';
import StepControls from './components/StepControls';
import RegisterTable from './components/RegisterTable';
import MemoryTable from './components/MemoryTable';
import DatapathValueTable from './components/DatapathValueTable';
import CurrentInstructionCard from './components/CurrentInstructionCard';
import {
    type DatapathSimulatorMode,
    useDatapathSimulator,
} from './hooks/useDatapathSimulator';
import type { DatapathInspectID } from '../../core/mips/single-cycle/inspector/types';
import type { DatapathMnemonic } from '../../types/mips';
import InspectorPanel from './components/InspectorPanel';

const modeOptions: Array<{ value: DatapathSimulatorMode; label: string }> = [
    { value: 'explore', label: 'Explore' },
    { value: 'simulate', label: 'Simulate' },
    { value: 'assembly', label: 'Assembly' },
];

export default function DatapathPage() {
    const simulator = useDatapathSimulator();
    const [isEditingSignals, setIsEditingSignals] = useState(false);
    const [selectedInspectId, setSelectedInspectId] =
        useState<DatapathInspectID | null>(null);

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
        instruction,
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
        programLoaded,
        programIndex,
        programFinished,
        handleLoadProgram,
    } = simulator;

    const logs = currentContext.logs ?? [];

    return (
        <main className="flex h-full min-h-0 flex-col bg-slate-50 p-3 text-slate-900 md:p-4 xl:overflow-hidden">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[1760px] flex-col">
                <header className="mb-3 flex flex-none flex-col justify-between gap-3 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-2xl font-bold">
                            MIPS Datapath Visualizer
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Step through the datapath, inspect values, and test
                            control signals.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 font-medium capitalize text-slate-600 shadow-sm ring-1 ring-slate-200">
                            {mode}
                        </span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 font-mono font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100">
                            {mode === 'assembly'
                                ? `program ${programIndex + 1}`
                                : mnemonic}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 font-mono font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                            {currentStep ?? 'FULL'}
                        </span>
                        <span
                            className={`rounded-full px-3 py-1 font-medium shadow-sm ring-1 ${
                                warnings.length === 0
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                    : 'bg-red-50 text-red-700 ring-red-100'
                            }`}
                        >
                            {warnings.length} warning
                            {warnings.length === 1 ? '' : 's'}
                        </span>
                    </div>
                </header>

                <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[300px_minmax(720px,1fr)_350px] 2xl:grid-cols-[310px_minmax(820px,1fr)_360px]">
                    <aside className="min-h-0 space-y-3 xl:overflow-y-auto xl:pr-1">
                        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Setup
                                </h2>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                                    {mode}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200">
                                {modeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            handleModeChange(option.value)
                                        }
                                        className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                                            mode === option.value
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {mode !== 'assembly' && (
                                <label className="mt-3 block">
                                    <span className="mb-1 block text-xs font-medium text-slate-600">
                                        Instruction
                                    </span>

                                    <select
                                        value={mnemonic}
                                        onChange={(event) =>
                                            setMnemonic(
                                                event.target
                                                    .value as DatapathMnemonic,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                                    >
                                        {datapathMnemonics.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </section>

                        {mode === 'assembly' && (
                            <AssemblyEditor
                                onLoad={handleLoadProgram}
                                programLoaded={programLoaded}
                                programIndex={programIndex}
                                programFinished={programFinished}
                            />
                        )}

                        {mode !== 'assembly' && (
                            <CurrentInstructionCard
                                instruction={instruction}
                                bits={bits}
                            />
                        )}

                        <StepControls
                            step={currentStep}
                            isFirstStep={isFirstStep}
                            isLastStep={isLastStep}
                            onPreviousStep={handlePreviousStep}
                            onNextStep={handleNextStep}
                            onResetStep={handleResetStep}
                        />

                        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Control Signals
                                </h2>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={resetControlSignals}
                                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsEditingSignals(
                                                (value) => !value,
                                            )
                                        }
                                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                            isEditingSignals
                                                ? 'bg-slate-900 text-white'
                                                : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {isEditingSignals ? 'Lock' : 'Edit'}
                                    </button>
                                </div>
                            </div>

                            <ControlSignalTable
                                signals={signals}
                                defaultSignals={defaultSignals}
                                onChange={handleSignalsChange}
                                editable={isEditingSignals}
                                datapathHighlight={datapathHighlight}
                            />
                        </section>
                    </aside>

                    <section className="flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-3 flex flex-none flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Datapath Diagram
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Click a component to inspect its current
                                    value.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                                    {currentStep ?? 'FULL'}
                                </span>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1">
                            <DatapathDiagram
                                bits={bits}
                                defaultActiveSegments={defaultActiveSegments}
                                currentActiveSegments={currentActiveSegments}
                                modifiedActiveSegments={modifiedActiveSegments}
                                defaultSignals={defaultSignals}
                                signals={signals}
                                datapathHighlight={datapathHighlight}
                                selectedInspectId={selectedInspectId}
                                onInspect={setSelectedInspectId}
                            />
                        </div>
                    </section>

                    <aside className="min-h-0 space-y-3 xl:overflow-y-auto xl:pr-1">
                        <InspectorPanel
                            id={selectedInspectId}
                            step={currentStep}
                            machine={machine}
                            context={currentContext}
                            signals={signals}
                            onClear={() => setSelectedInspectId(null)}
                        />
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

                        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Execution Log
                                </h2>

                                <span className="text-xs text-slate-500">
                                    {warnings.length} warning
                                    {warnings.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs">
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
