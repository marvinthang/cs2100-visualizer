import { useState } from 'react';
import { getDatapathControlSignals } from '../../../core/mips/single-cycle/control/datapathControl';
import type {
    ControlSignalId,
    RuntimeControlSignals,
} from '../../../core/mips/single-cycle/control/types';
import { getActiveDatapathBasePaths } from '../../../core/mips/single-cycle/diagram/datapathBasePaths';
import {
    getControlSignalDrivenPathMap,
    getControlSignalDrivenPaths,
} from '../../../core/mips/single-cycle/diagram/datapathControlSignalDrivenPaths';
import { getActiveDatapathSegments } from '../../../core/mips/single-cycle/diagram/datapathSegments';
import { getDatapathStepPaths } from '../../../core/mips/single-cycle/diagram/datapathStepPaths';
import {
    datapathSteps,
    getCurrentStep,
    getNextStepIndex,
    isLastStep as isLastDatapathStep,
} from '../../../core/mips/single-cycle/diagram/datapathSteps';
import { executeDatapathStep } from '../../../core/mips/single-cycle/execution/executeDatapathStep';
import {
    type ExecutionContext,
    createEmptyExecutionContext,
} from '../../../core/mips/single-cycle/execution/executionContext';
import {
    createInitialMachineState,
    createZeroedDataMemory,
    type MachineState,
} from '../../../core/mips/single-cycle/execution/machineState';
import { getDatapathHighlightState } from '../../../core/mips/single-cycle/highlight/datapathHighlightState';
import { getMachineStateHighlights } from '../../../core/mips/single-cycle/highlight/machineStateHighlights';
import { datapathInstructionExamples } from '../../../core/mips/instruction/datapathInstructionExamples';
import { encodeMipsInstruction } from '../../../core/mips/instruction/encodeMipsInstruction';
import type { DatapathMnemonic, RegisterNumber } from '../../../types/mips';

type StepSnapshot = {
    machine: MachineState;
    currentContext: ExecutionContext;
    defaultContext: ExecutionContext;
    signals: RuntimeControlSignals;
    stepIndex: number | null;
    warnings: string[];
};

export type DatapathSimulatorMode = 'explore' | 'simulate';

export function useDatapathSimulator() {
    const [mnemonic, setMnemonic] = useState<DatapathMnemonic>('add');

    const [defaultSignals, setDefaultSignals] = useState<RuntimeControlSignals>(
        () => getDatapathControlSignals(mnemonic),
    );

    const [signals, setSignals] = useState<RuntimeControlSignals>(() =>
        getDatapathControlSignals(mnemonic),
    );

    const [machine, setMachine] = useState<MachineState>(() =>
        createInitialMachineState(),
    );
    const [currentContext, setCurrentContext] = useState<ExecutionContext>(() =>
        createEmptyExecutionContext(),
    );
    const [defaultContext, setDefaultContext] = useState<ExecutionContext>(() =>
        createEmptyExecutionContext(),
    );

    const [stepIndex, setStepIndex] = useState<number | null>(null);
    const [mode, setMode] = useState<DatapathSimulatorMode>('explore');
    const [warnings, setWarnings] = useState<string[]>([]);
    const [snapshots, setSnapshots] = useState<StepSnapshot[]>([]);

    const instruction = datapathInstructionExamples[mnemonic];
    const bits = encodeMipsInstruction(instruction);
    const currentStep = getCurrentStep(stepIndex);

    function resetExecutionState(nextMnemonic = mnemonic) {
        setCurrentContext(createEmptyExecutionContext());
        setDefaultContext(createEmptyExecutionContext());
        setStepIndex(null);
        setWarnings([]);
        setSnapshots([]);
        setSignals((prev) => {
            const next = { ...prev };
            delete next.PCSrc;
            return next;
        });
        setDefaultSignals(getDatapathControlSignals(nextMnemonic));
    }

    function handleSignalsChange(newSignals: RuntimeControlSignals) {
        setSignals(newSignals);
        resetExecutionState();
    }

    function handleMnemonicChange(nextMnemonic: DatapathMnemonic) {
        setMnemonic(nextMnemonic);
        setSignals(getDatapathControlSignals(nextMnemonic));
        resetExecutionState(nextMnemonic);
    }

    function handleModeChange(nextMode: DatapathSimulatorMode) {
        setMode(nextMode);
        resetExecutionState();
    }

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

        resetExecutionState();
    }

    function handleMemoryChange(address: number, value: number) {
        setMachine((machine) => ({
            ...machine,
            dataMemory: {
                ...machine.dataMemory,
                [address]: value,
            },
        }));

        resetExecutionState();
    }

    function handleMemoryRangeChange(startAddress: number, wordCount: number) {
        setMachine((machine) => {
            const dataMemory: Record<number, number> = {};

            startAddress = Math.max(0, startAddress);
            startAddress = startAddress - (startAddress % 4);

            for (let i = 0; i < wordCount; i++) {
                const addresss = startAddress + i * 4;
                dataMemory[addresss] = machine.dataMemory[addresss] ?? 0;
            }

            return {
                ...machine,
                dataMemory,
            };
        });

        resetExecutionState();
    }

    function handleResetRegisters() {
        setMachine(
            (machine) =>
                ({
                    ...machine,
                    registers: {},
                }) as MachineState,
        );

        resetExecutionState();
    }

    function handleResetMemory() {
        setMachine((machine) => {
            const addresses = Object.keys(machine.dataMemory).map(Number);
            const dataMemory: Record<number, number> =
                addresses.length > 0
                    ? Object.fromEntries(
                          addresses.map((address) => [address, 0]),
                      )
                    : createZeroedDataMemory();

            return {
                ...machine,
                dataMemory,
            };
        });

        resetExecutionState();
    }

    function handlePreviousStep() {
        console.log('Restoring snapshot:', snapshots);
        const last_snapshot = snapshots[snapshots.length - 1];

        if (last_snapshot === undefined) {
            return;
        }

        setMachine(last_snapshot.machine);
        setCurrentContext(last_snapshot.currentContext);
        setDefaultContext(last_snapshot.defaultContext);
        setStepIndex(last_snapshot.stepIndex);
        setWarnings(last_snapshot.warnings);
        setSignals(last_snapshot.signals);

        setSnapshots((snapshots) => snapshots.slice(0, -1));
    }

    function handleNextStep() {
        const nextStepIndex = getNextStepIndex(stepIndex);

        if (nextStepIndex === null) {
            return;
        }

        setSnapshots((snapshots) => [
            ...snapshots,
            {
                machine,
                currentContext,
                defaultContext,
                signals: { ...signals },
                stepIndex,
                warnings,
            },
        ]);

        const step = datapathSteps[nextStepIndex];

        const defaultResult = executeDatapathStep(
            machine,
            defaultContext,
            instruction,
            defaultSignals,
            step,
            false,
        );

        setDefaultContext(defaultResult.executionContext);
        setDefaultSignals(defaultResult.signals);

        const currentResult = executeDatapathStep(
            machine,
            currentContext,
            instruction,
            signals,
            step,
            mode === 'simulate',
        );

        setMachine(currentResult.machineState);
        setCurrentContext(currentResult.executionContext);
        setSignals(currentResult.signals);

        setStepIndex(nextStepIndex);
        setWarnings(currentResult.warnings);
    }

    function handleResetStep() {
        setCurrentContext(createEmptyExecutionContext());
        setDefaultContext(createEmptyExecutionContext());

        resetExecutionState();
    }

    function resetControlSignals() {
        setSignals(getDatapathControlSignals(mnemonic));
        resetExecutionState();
    }

    const basePaths = getActiveDatapathBasePaths(mnemonic);

    const defaultSignalDrivenPaths =
        getControlSignalDrivenPaths(defaultSignals);
    const currentSignalDrivenPaths = getControlSignalDrivenPaths(signals);
    const modifiedActiveDrivenPaths = Object.entries(
        getControlSignalDrivenPathMap(signals),
    ).flatMap(([signal, paths]) => {
        const name = signal as ControlSignalId;
        if (signals[name] === defaultSignals[name]) {
            return [];
        }
        return paths ? paths.filter((path) => path.includes('_MUX_TO_')) : [];
    });

    const fullDefaultActivePaths = [...basePaths, ...defaultSignalDrivenPaths];
    const fullCurrentActivePaths = [...basePaths, ...currentSignalDrivenPaths];

    const defaultVisiblePaths =
        currentStep === null
            ? fullDefaultActivePaths
            : getDatapathStepPaths(
                  currentStep,
                  instruction,
                  defaultSignals,
                  defaultContext,
              );
    const currentVisiblePaths =
        currentStep === null
            ? fullCurrentActivePaths
            : getDatapathStepPaths(
                  currentStep,
                  instruction,
                  signals,
                  currentContext,
              );
    const modifiedPaths = modifiedActiveDrivenPaths;

    const defaultActiveSegments =
        getActiveDatapathSegments(defaultVisiblePaths);
    const currentActiveSegments =
        getActiveDatapathSegments(currentVisiblePaths);
    const modifiedActiveSegments = getActiveDatapathSegments(modifiedPaths);

    const datapathHighlight = getDatapathHighlightState(
        currentStep,
        signals,
        defaultSignals,
        currentContext,
    );

    const machineHighlight = getMachineStateHighlights(
        currentStep,
        signals,
        currentContext,
    );

    return {
        mnemonic,
        setMnemonic: handleMnemonicChange,
        defaultSignals,
        signals,
        mode,
        handleModeChange,
        machine,
        currentContext,
        warnings,
        bits,
        currentStep,
        isFirstStep: snapshots.length === 0,
        isLastStep: isLastDatapathStep(stepIndex),
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
    };
}
