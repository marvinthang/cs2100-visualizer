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

function SignalLegend({
    colorClass,
    label,
}: {
    colorClass: string;
    label: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
            <span className={`h-2 w-2 rounded-full ${colorClass}`} />
            {label}
        </span>
    );
}

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
        <main className="flex h-full min-h-0 flex-col bg-[#eef2f3] p-3 text-slate-900 sm:p-4 lg:p-5 xl:overflow-hidden">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[1760px] flex-col gap-4">
                <header className="flex-none overflow-hidden rounded-lg border border-slate-200 bg-[#fbfcfd] shadow-sm">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-950">
                                    MIPS Datapath Visualizer
                                </h1>
                                <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold capitalize text-white">
                                    {mode}
                                </span>
                                {warnings.length > 0 && (
                                    <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                        Attention needed
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                Step through the datapath, inspect values, and
                                test control signals.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 xl:grid-cols-5">
                            <StatusPill label="PC" value={machine.pc} />
                            <StatusPill
                                label={
                                    mode === 'assembly'
                                        ? 'Program'
                                        : 'Instruction'
                                }
                                value={
                                    mode === 'assembly'
                                        ? programIndex + 1
                                        : mnemonic
                                }
                            />
                            <StatusPill
                                label="Step"
                                value={currentStep ?? 'FULL'}
                            />
                            <StatusPill
                                label="Warnings"
                                value={warnings.length}
                            />
                            <StatusPill
                                label="Signals"
                                value={isEditingSignals ? 'EDIT' : 'LOCK'}
                            />
                        </div>
                    </div>
                </header>

                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[310px_minmax(720px,1fr)_370px] 2xl:grid-cols-[320px_minmax(880px,1fr)_380px]">
                    <aside className="min-h-0 space-y-3 xl:overflow-y-auto xl:pr-1">
                        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Setup
                                </h2>
                                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold capitalize text-slate-600">
                                    {mode}
                                </span>
                            </div>

                            <div className="p-3">
                                <div className="grid grid-cols-3 rounded-md bg-slate-100 p-1 ring-1 ring-slate-200">
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
                                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                        >
                                            {datapathMnemonics.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                            </div>
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

                        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Control Signals
                                </h2>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={resetControlSignals}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
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
                                                : 'border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        {isEditingSignals ? 'Lock' : 'Edit'}
                                    </button>
                                </div>
                            </div>

                            <div className="p-3">
                                <ControlSignalTable
                                    signals={signals}
                                    defaultSignals={defaultSignals}
                                    onChange={handleSignalsChange}
                                    editable={isEditingSignals}
                                    datapathHighlight={datapathHighlight}
                                />
                            </div>
                        </section>
                    </aside>

                    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                        <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3">
                            <div>
                                <h2 className="text-base font-semibold tracking-tight text-slate-950">
                                    Datapath Diagram
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Click a component to inspect its current
                                    value.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                <SignalLegend
                                    colorClass="bg-red-500"
                                    label="Default path"
                                />
                                <SignalLegend
                                    colorClass="bg-amber-400"
                                    label="Modified path"
                                />
                                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                                    {currentStep ?? 'FULL'}
                                </span>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#f8fafc] p-3">
                            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-inner">
                                <DatapathDiagram
                                    bits={bits}
                                    defaultActiveSegments={
                                        defaultActiveSegments
                                    }
                                    currentActiveSegments={
                                        currentActiveSegments
                                    }
                                    modifiedActiveSegments={
                                        modifiedActiveSegments
                                    }
                                    defaultSignals={defaultSignals}
                                    signals={signals}
                                    datapathHighlight={datapathHighlight}
                                    selectedInspectId={selectedInspectId}
                                    onInspect={setSelectedInspectId}
                                />
                            </div>
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

                        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-[#fbfcfd] px-4 py-3">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Execution Log
                                </h2>

                                <span
                                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                                        warnings.length === 0
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-red-200 bg-red-50 text-red-700'
                                    }`}
                                >
                                    {warnings.length} warning
                                    {warnings.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="p-3">
                                <div className="max-h-64 overflow-auto rounded-md bg-slate-950 p-3 font-mono text-xs">
                                    {logs.length === 0 &&
                                        warnings.length === 0 && (
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
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}
