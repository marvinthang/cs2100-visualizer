import { useEffect, useState } from 'react';
import { datapathMnemonics } from '../../core/mips/instructionSet';
import { getDatapathControlSignals } from '../../core/mips/datapathControl';
import type { ControlSignals, DatapathMnemonic, RegisterNumber } from '../../types/mips';

import ControlSignalTable from './components/ControlSignalTable';
import InstructionSelector from './components/InstructionSelector';
import { getActiveDatapathBasePaths } from '../../core/mips/datapathBasePaths';
import { getControlSignalDrivenPathMap, getControlSignalDrivenPaths } from '../../core/mips/datapathRuntimePaths';
import DatapathDiagram from './components/DatapathDiagram';
import { getActiveDatapathSegments } from '../../core/mips/datapathSegments';
import StepControls from './components/StepControls';
import RegisterTable from './components/RegisterTable';
import MemoryTable from './components/MemoryTable';
import { createInitialMachineState, createZeroedDataMemory, type MachineState } from '../../core/mips/machineState';
import { type ExecutionContext, createEmptyExecutionContext } from '../../core/mips/executionContext';
import { datapathInstructionExamples } from '../../core/mips/datapathInstructionExamples';
import { datapathStages, getCurrentStage, getNextStageIndex, isLastStage } from '../../core/mips/datapathStages';
import executeDatapathStep from '../../core/mips/executeDatapathStep';
import datapathStepPaths from '../../core/mips/datapathStepPaths';
import DatapathValueTable from './components/DatapathValueTable';
import instructionEncode from '../../core/mips/instructionEncode';
import datapathHighlightState from '../../core/mips/datapathHighlightState';
import machineStateHighlights from '../../core/mips/machineStateHighlights';

type StepSnapshot = {
    machine: MachineState;
    currentContext: ExecutionContext;
    defaultContext: ExecutionContext;
    stepIndex: number | null;
    warnings: string[];
};

export default function DatapathPage() {
    const [mnemonic, setMnemonic] = useState<DatapathMnemonic>('add');

    const [signals, setSignals] = useState<ControlSignals>(() =>
        getDatapathControlSignals(mnemonic)
    );

    const [isEditingSignals, setIsEditingSignals] = useState(false);

    const [machine, setMachine] = useState<MachineState>(() => createInitialMachineState());
    const [currentContext, setCurrentContext] = useState<ExecutionContext>(() => createEmptyExecutionContext());

    const [defaultContext, setDefaultContext] = useState<ExecutionContext>(() => createEmptyExecutionContext());

    const [stepIndex, setStepIndex] = useState<number | null>(null);
    const [mode, setMode] = useState<'explore' | 'simulate'>('explore');
    const [warnings, setWarnings] = useState<string[]>([]);

    const [snapshots, setSnapshots] = useState<StepSnapshot[]>([]);

    const instruction = datapathInstructionExamples[mnemonic];
    const bits = instructionEncode(instruction);
    const currentStage = getCurrentStage(stepIndex);

    function resetAllState() {
        setCurrentContext(createEmptyExecutionContext());
        setDefaultContext(createEmptyExecutionContext());
        setStepIndex(null);
        setWarnings([]);
        setSnapshots([]);
    }

    function handleSignalsChange(newSignals: ControlSignals) {
        setSignals(newSignals);
        resetAllState();
    }
        
    useEffect(() => {
        setSignals(getDatapathControlSignals(mnemonic));
        resetAllState();
    }, [mnemonic]);

    void currentContext;
    void setCurrentContext;

    function handleRegisterChange(register: RegisterNumber, value: number) {
        setMachine((machine) => {
            if (register === 0) {
                return machine;
            }
            return {
                ...machine,
                registers: {
                    ...machine.registers,
                    [register]: value,
                },
            };
        });

        resetAllState();
    }

    function handleMemoryChange(address: number, value: number) {
        setMachine((machine) => ({
            ...machine,
            dataMemory: {
                ...machine.dataMemory,
                [address]: value,
            },
        }));

        resetAllState();
    }

    function handleMemoryRangeChange(startAddress: number, wordCount: number) {
        setMachine((machine) => {
            const dataMemory: Record<number, number> = {};

            startAddress = Math.max(0, startAddress);
            startAddress = startAddress - (startAddress % 4);

            for (let i = 0; i < wordCount; i++) {
                const addresss = startAddress + i * 4;
                dataMemory[addresss] = machine.dataMemory[addresss] ?? 0
            }

            return {
                ...machine,
                dataMemory,
            };
        });

        resetAllState();
    }

    function handleResetRegisters() {
        setMachine((machine) => ({
            ...machine,
            registers: {},
        }) as MachineState);

        resetAllState();
    }

    function handleResetMemory() {
        setMachine((machine) => {
            const addresses = Object.keys(machine.dataMemory).map(Number);
            const dataMemory: Record<number, number> =
                addresses.length > 0
                    ? Object.fromEntries(addresses.map((address) => [address, 0]))
                    : createZeroedDataMemory();

            return {
                ...machine,
                dataMemory,
            };
        });

        resetAllState();
    }

    function handlePreviousStep() {
        const last_snapshot = snapshots[snapshots.length - 1];

        if (last_snapshot === undefined) {
            return;
        }

        setMachine(last_snapshot.machine);
        setCurrentContext(last_snapshot.currentContext);
        setDefaultContext(last_snapshot.defaultContext);
        setStepIndex(last_snapshot.stepIndex);
        setWarnings(last_snapshot.warnings);

        setSnapshots((snapshots) => snapshots.slice(0, -1));
    }

    function handleNextStep() {
        setSnapshots((snapshots) => [
            ...snapshots,
            {
                machine,
                currentContext,
                defaultContext,
                stepIndex,
                warnings,
            },
        ]);

        const nextStepIndex = getNextStageIndex(stepIndex);

        if (nextStepIndex === null) {
            return;
        }

        const stage = datapathStages[nextStepIndex];

        const defaultResult = executeDatapathStep(
            machine,
            defaultContext,
            instruction,
            getDatapathControlSignals(mnemonic),
            stage,
            false
        );

        const currentResult = executeDatapathStep(
            machine,
            currentContext,
            instruction,
            signals,
            stage,
            mode === "simulate"
        )

        setMachine(currentResult.machineState);
        setCurrentContext(currentResult.executionContext);
        setDefaultContext(defaultResult.executionContext);

        setStepIndex(nextStepIndex);
        setWarnings(currentResult.warnings);
    }

    function handleResetStep() {
        setCurrentContext(createEmptyExecutionContext());
        setDefaultContext(createEmptyExecutionContext());
        
        setStepIndex(null);
        setWarnings([]);

        setSnapshots([]);
    }

    const defaultSignals = getDatapathControlSignals(mnemonic);

    const basePaths = getActiveDatapathBasePaths(mnemonic);

    const defaultSignalDrivenPaths = getControlSignalDrivenPaths(defaultSignals);
    const currentSignalDrivenPaths = getControlSignalDrivenPaths(signals);
    const modifiedActiveDrivenPaths = Object.entries(getControlSignalDrivenPathMap(signals)).flatMap(([signal, paths]) => {
        const name = signal as keyof ControlSignals;
        if (signals[name] === defaultSignals[name]) {
            return [];
        }
        return paths ? paths.filter((path) => path.includes('_MUX_TO_')) : [];
    });

    const fullDefaultActivePaths = [...basePaths, ...defaultSignalDrivenPaths];
    const fullCurrentActivePaths = [...basePaths, ...currentSignalDrivenPaths];

    const defaultVisiblePaths = currentStage === null
        ? fullDefaultActivePaths
        : datapathStepPaths(
            currentStage,
            instruction,
            defaultSignals,
            defaultContext,
        );
    const currentVisiblePaths =
    currentStage === null
        ? fullCurrentActivePaths
        : datapathStepPaths(
              currentStage,
              instruction,
              signals,
              currentContext,
          );
    const modifiedPaths = modifiedActiveDrivenPaths;

    const defaultActiveSegments = getActiveDatapathSegments(defaultVisiblePaths);
    const currentActiveSegments = getActiveDatapathSegments(currentVisiblePaths);
    const modifiedActiveSegments = getActiveDatapathSegments(modifiedPaths);

    const datapathHighlight = datapathHighlightState(
        currentStage,
        signals,
        defaultSignals,
        currentContext,
    );

    const machineHighlight = machineStateHighlights(
        currentStage,
        signals,
        currentContext,
    )

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold">MIPS Datapath Visualizer</h1>
            
            <div className="mt-6 grid grid-cols-[320px_1fr] gap-6">
                <section>

                    <InstructionSelector
                        mnemonics={datapathMnemonics}
                        value={mnemonic}
                        onChange={setMnemonic}
                    />

                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">Mode</span>
                        <select
                            value={mode}
                            onChange={(event) => setMode(event.target.value as 'explore' | 'simulate')}
                            className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                        >
                            <option value="explore">Explore</option>
                            <option value="simulate">Simulate</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSignals(getDatapathControlSignals(mnemonic));
                            resetAllState();
                        }}
                        className="mt-4 rounded border px-3 py-2 text-sm font-medium"
                    >
                        Reset Control Signals
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsEditingSignals((value) => !value)}
                        className="mt-4 rounded border px-3 py-2 text-sm font-medium"
                    >
                        {isEditingSignals ? 'Lock signals' : 'Edit signals'}
                    </button>

                    <ControlSignalTable
                        signals={signals}
                        defaultSignals={defaultSignals}
                        onChange={handleSignalsChange}
                        editable={isEditingSignals}
                        datapathHighlight={datapathHighlight}
                    />

                    <StepControls
                        stage={currentStage}
                        isFirstStage={snapshots.length === 0}
                        isLastStage={isLastStage(stepIndex)}
                        onPreviousStep={handlePreviousStep}
                        onNextStep={handleNextStep}
                        onResetStep={handleResetStep}
                    />
                </section>

                <section className="overflow-auto">
                    <DatapathDiagram 
                        bits={bits}
                        defaultActiveSegments={defaultActiveSegments}
                        currentActiveSegments={currentActiveSegments}
                        modifiedActiveSegments={modifiedActiveSegments}
                        defaultSignals={defaultSignals}
                        signals={signals}
                        datapathHighlight={datapathHighlight}
                    />
                </section>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>
        </main>
    );
}
