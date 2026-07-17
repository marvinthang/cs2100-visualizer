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
import { executeInstruction } from '../../../core/mips/execution/executeInstruction';
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
import {
    assembleProgram,
    type AssembleResult,
    type AssembledInstruction,
} from '../../../core/mips/assembly/assembleProgram';
import type { DatapathMnemonic, RegisterNumber } from '../../../types/mips';

type StepSnapshot = {
    machine: MachineState;
    currentContext: ExecutionContext;
    defaultContext: ExecutionContext;
    signals: RuntimeControlSignals;
    stepIndex: number | null;
    warnings: string[];
    programIndex: number;
};

export type DatapathSimulatorMode = 'explore' | 'simulate' | 'assembly';

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

    // Assembly-program state: the loaded program, which instruction is being
    // stepped (programIndex, not machine.pc, since pc advances mid-instruction
    // during MEM), and the machine snapshot captured at load for Reset.
    const [program, setProgram] = useState<AssembledInstruction[]>([]);
    const [programIndex, setProgramIndex] = useState(0);
    const [loadedMachine, setLoadedMachine] = useState<MachineState | null>(
        null,
    );
    // source line numbers (1-based) the user marked as breakpoints
    const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());

    const isAssembly = mode === 'assembly';
    const activeInstruction =
        isAssembly && programIndex < program.length
            ? program[programIndex]
            : undefined;
    const effectiveMnemonic = activeInstruction?.fields.mnemonic ?? mnemonic;
    const instruction =
        activeInstruction?.fields ?? datapathInstructionExamples[mnemonic];
    const bits = encodeMipsInstruction(instruction);
    const currentStep = getCurrentStep(stepIndex);
    const programFinished =
        isAssembly && program.length > 0 && machine.pc / 4 >= program.length;

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
        setProgramIndex(0);
        resetExecutionState();
    }

    // Assemble the editor source and load it as the running program. Returns the
    // assemble result so the editor can show errors; only loads when clean.
    function handleLoadProgram(source: string): AssembleResult {
        const result = assembleProgram(source);
        if (result.errors.length > 0 || result.instructions.length === 0) {
            return result;
        }

        const initialMachine: MachineState = { ...machine, pc: 0 };
        const firstMnemonic = result.instructions[0].fields.mnemonic;

        setProgram(result.instructions);
        setProgramIndex(0);
        setLoadedMachine(initialMachine);
        setMachine(initialMachine);
        setStepIndex(null);
        setSnapshots([]);
        setCurrentContext(createEmptyExecutionContext());
        setDefaultContext(createEmptyExecutionContext());
        setWarnings([]);
        setSignals(getDatapathControlSignals(firstMnemonic));
        setDefaultSignals(getDatapathControlSignals(firstMnemonic));

        return result;
    }

    // After an instruction's final step, fetch the next one. machine.pc already
    // points at it (set during MEM), so the next index is pc / 4.
    function advanceToNextInstruction() {
        const nextIndex = machine.pc / 4;
        if (nextIndex >= program.length) {
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
                programIndex,
            },
        ]);

        const nextMnemonic = program[nextIndex].fields.mnemonic;
        setProgramIndex(nextIndex);
        setStepIndex(null);
        setCurrentContext(createEmptyExecutionContext());
        setDefaultContext(createEmptyExecutionContext());
        setWarnings([]);
        setSignals(getDatapathControlSignals(nextMnemonic));
        setDefaultSignals(getDatapathControlSignals(nextMnemonic));
    }

    // Toggle a breakpoint on a source line.
    function toggleBreakpoint(line: number) {
        setBreakpoints((current) => {
            const next = new Set(current);
            if (next.has(line)) {
                next.delete(line);
            } else {
                next.add(line);
            }
            return next;
        });
    }

    // Jump to the start of instruction `target`, replaying the machine from the
    // loaded state with the pure single-cycle executor (same values as stepping
    // every stage). A snapshot is pushed so Prev returns to where we were.
    function jumpToInstruction(target: number) {
        const clamped = Math.max(0, Math.min(target, program.length));

        let replayed: MachineState = {
            ...(loadedMachine ?? machine),
            pc: 0,
        };
        for (let k = 0; k < clamped; k++) {
            replayed = executeInstruction(replayed, program[k].fields);
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
                programIndex,
            },
        ]);

        setMachine(replayed);
        setProgramIndex(clamped);
        setStepIndex(null);
        setCurrentContext(createEmptyExecutionContext());
        setDefaultContext(createEmptyExecutionContext());
        setWarnings([]);

        const nextMnemonic = program[clamped]?.fields.mnemonic;
        if (nextMnemonic) {
            setSignals(getDatapathControlSignals(nextMnemonic));
            setDefaultSignals(getDatapathControlSignals(nextMnemonic));
        }
    }

    // Fast-forward whole instructions until the next one sits on a breakpoint
    // line, or the program ends.
    function handleRunToBreakpoint() {
        if (!isAssembly || program.length === 0 || programFinished) {
            return;
        }

        let target = program.length;
        for (let i = programIndex + 1; i < program.length; i++) {
            if (breakpoints.has(program[i].line)) {
                target = i;
                break;
            }
        }

        jumpToInstruction(target);
    }

    // Edit the PC to jump to any instruction (pc is a byte address; snap to the
    // enclosing instruction). Only meaningful with a loaded program.
    function handlePcChange(pc: number) {
        if (!isAssembly || program.length === 0) {
            return;
        }
        jumpToInstruction(Math.round(pc / 4));
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
        setProgramIndex(last_snapshot.programIndex);

        setSnapshots((snapshots) => snapshots.slice(0, -1));
    }

    function handleNextStep() {
        if (isAssembly) {
            if (program.length === 0) {
                return;
            }
            if (isLastDatapathStep(stepIndex)) {
                advanceToNextInstruction();
                return;
            }
        }

        const nextStepIndex = getNextStepIndex(stepIndex);

        setSnapshots((snapshots) => [
            ...snapshots,
            {
                machine,
                currentContext,
                defaultContext,
                signals: { ...signals },
                stepIndex,
                warnings,
                programIndex,
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
            mode === 'simulate' || isAssembly,
        );

        setMachine(currentResult.machineState);
        setCurrentContext(currentResult.executionContext);
        setSignals(currentResult.signals);

        setStepIndex(nextStepIndex);
        setWarnings(currentResult.warnings);
    }

    function handleResetStep() {
        if (isAssembly && loadedMachine) {
            const firstMnemonic = program[0]?.fields.mnemonic ?? mnemonic;
            setMachine(loadedMachine);
            setProgramIndex(0);
            setStepIndex(null);
            setSnapshots([]);
            setWarnings([]);
            setCurrentContext(createEmptyExecutionContext());
            setDefaultContext(createEmptyExecutionContext());
            setSignals(getDatapathControlSignals(firstMnemonic));
            setDefaultSignals(getDatapathControlSignals(firstMnemonic));
            return;
        }

        setCurrentContext(createEmptyExecutionContext());
        setDefaultContext(createEmptyExecutionContext());

        resetExecutionState();
    }

    function resetControlSignals() {
        setSignals(getDatapathControlSignals(mnemonic));
        resetExecutionState();
    }

    const basePaths = getActiveDatapathBasePaths(effectiveMnemonic);

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
        instruction,
        bits,
        currentStep,
        isFirstStep: snapshots.length === 0,
        isLastStep: isAssembly
            ? isLastDatapathStep(stepIndex) && programFinished
            : isLastDatapathStep(stepIndex),
        program,
        programIndex,
        programLoaded: program.length > 0,
        programFinished,
        handleLoadProgram,
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
        breakpoints,
        toggleBreakpoint,
        handleRunToBreakpoint,
        handlePcChange,
    };
}
