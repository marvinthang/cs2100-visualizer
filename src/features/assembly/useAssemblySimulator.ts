import { useState } from 'react';
import {
    assembleMipsProgram,
    type AssembledMipsInstruction,
} from '../../core/mips/assembly/assembleMipsProgram';
import { executeInstruction } from '../../core/mips/execution/executeInstruction';
import {
    createInitialMachineState,
    createZeroedDataMemory,
    readRegister,
    type MachineState,
} from '../../core/mips/single-cycle/execution/machineState';
import type {
    HighlightRole,
    MachineStateHighlightState,
} from '../../core/mips/single-cycle/highlight/types';
import type { MipsInstructionFields, RegisterNumber } from '../../types/mips';

const emptyHighlight: MachineStateHighlightState = {
    registers: {},
    memory: {},
};

function setRole<T extends string | number>(
    target: Partial<Record<T, HighlightRole>>,
    key: T,
    role: HighlightRole,
) {
    if (target[key] === 'output') {
        return;
    }
    target[key] = role;
}

function setRegisterRole(
    registers: MachineStateHighlightState['registers'],
    register: RegisterNumber | undefined,
    role: HighlightRole,
) {
    if (register === undefined) {
        return;
    }
    if (role === 'output' && register === 0) {
        return;
    }
    setRole(registers, register, role);
}

function setMemoryRole(
    memory: MachineStateHighlightState['memory'],
    address: number,
    role: HighlightRole,
) {
    if (address % 4 !== 0) {
        return;
    }
    setRole(memory, address, role);
}

// Highlight every register or memory cell related to the executed instruction:
// inputs are read by the instruction, outputs are written by it.
function getInstructionHighlights(
    machine: MachineState,
    fields: MipsInstructionFields,
): MachineStateHighlightState {
    const registers: MachineStateHighlightState['registers'] = {};
    const memory: MachineStateHighlightState['memory'] = {};

    switch (fields.mnemonic) {
        case 'add':
        case 'sub':
        case 'and':
        case 'or':
        case 'nor':
        case 'slt':
            setRegisterRole(registers, fields.rs, 'input');
            setRegisterRole(registers, fields.rt, 'input');
            setRegisterRole(registers, fields.rd, 'output');
            break;
        case 'sll':
        case 'srl':
            setRegisterRole(registers, fields.rt, 'input');
            setRegisterRole(registers, fields.rd, 'output');
            break;
        case 'addi':
        case 'andi':
        case 'ori':
            setRegisterRole(registers, fields.rs, 'input');
            setRegisterRole(registers, fields.rt, 'output');
            break;
        case 'lui':
            setRegisterRole(registers, fields.rt, 'output');
            break;
        case 'lw': {
            const address = readRegister(machine, fields.rs) + fields.immediate;
            setRegisterRole(registers, fields.rs, 'input');
            setMemoryRole(memory, address, 'input');
            setRegisterRole(registers, fields.rt, 'output');
            break;
        }
        case 'sw': {
            const address = readRegister(machine, fields.rs) + fields.immediate;
            setRegisterRole(registers, fields.rs, 'input');
            setRegisterRole(registers, fields.rt, 'input');
            setMemoryRole(memory, address, 'output');
            break;
        }
        case 'beq':
        case 'bne':
            setRegisterRole(registers, fields.rs, 'input');
            setRegisterRole(registers, fields.rt, 'input');
            break;
        case 'j':
            break;
    }

    return { registers, memory, pc: 'output' };
}

export function useAssemblySimulator() {
    const [machine, setMachine] = useState<MachineState>(() =>
        createInitialMachineState(),
    );
    const [program, setProgram] = useState<AssembledMipsInstruction[]>([]);
    const [programIndex, setProgramIndex] = useState(0);
    const [loadedMachine, setLoadedMachine] = useState<MachineState | null>(
        null,
    );
    const [machineHighlight, setMachineHighlight] =
        useState<MachineStateHighlightState>(emptyHighlight);
    // Snapshot the complete displayed state before each step so Back restores
    // both the machine values and the highlights for that state.
    const [history, setHistory] = useState<
        {
            machine: MachineState;
            programIndex: number;
            machineHighlight: MachineStateHighlightState;
        }[]
    >([]);

    const programLoaded = program.length > 0;
    const programFinished = programLoaded && programIndex >= program.length;
    const canStepBack = history.length > 0;

    function handleLoadProgram(
        source: string,
        preparedMachine: MachineState = machine,
    ): void {
        const result = assembleMipsProgram(source);
        if (result.errors.length > 0 || result.instructions.length === 0) {
            return;
        }

        const initialMachine: MachineState = { ...preparedMachine, pc: 0 };
        setProgram(result.instructions);
        setProgramIndex(0);
        setLoadedMachine(initialMachine);
        setMachine(initialMachine);
        setMachineHighlight(emptyHighlight);
        setHistory([]);
    }

    // Execute the current instruction in full, then advance to whatever PC it
    // produced (next instruction, branch target, or jump target).
    function handleStepInstruction() {
        if (!programLoaded || programIndex >= program.length) {
            return;
        }

        const after = executeInstruction(machine, program[programIndex].fields);
        setHistory((history) => [
            ...history,
            { machine, programIndex, machineHighlight },
        ]);
        setMachineHighlight(
            getInstructionHighlights(machine, program[programIndex].fields),
        );
        setMachine(after);
        setProgramIndex(after.pc / 4);
    }

    // Undo the last step: restore the machine and index from before it ran.
    function handleStepBack() {
        if (history.length === 0) {
            return;
        }
        const previous = history[history.length - 1];
        setMachine(previous.machine);
        setProgramIndex(previous.programIndex);
        setMachineHighlight(previous.machineHighlight);
        setHistory(history.slice(0, -1));
    }

    function handleResetProgram() {
        if (loadedMachine === null) {
            return;
        }
        setMachine(loadedMachine);
        setProgramIndex(0);
        setMachineHighlight(emptyHighlight);
        setHistory([]);
    }

    function handleRegisterChange(register: RegisterNumber, value: number) {
        if (register === 0) {
            return;
        }
        setMachine((machine) => ({
            ...machine,
            registers: { ...machine.registers, [register]: value },
        }));
        setMachineHighlight(emptyHighlight);
    }

    function handleResetRegisters() {
        setMachine(
            (machine) => ({ ...machine, registers: {} }) as MachineState,
        );
        setMachineHighlight(emptyHighlight);
    }

    function handleMemoryChange(address: number, value: number) {
        setMachine((machine) => ({
            ...machine,
            dataMemory: { ...machine.dataMemory, [address]: value },
        }));
        setMachineHighlight(emptyHighlight);
    }

    function handleMemoryRangeChange(startAddress: number, wordCount: number) {
        setMachine((machine) => {
            const dataMemory: Record<number, number> = {};
            const start = Math.max(0, startAddress - (startAddress % 4));
            for (let i = 0; i < wordCount; i++) {
                const address = start + i * 4;
                dataMemory[address] = machine.dataMemory[address] ?? 0;
            }
            return { ...machine, dataMemory };
        });
        setMachineHighlight(emptyHighlight);
    }

    function handleResetMemory() {
        setMachine((machine) => {
            const addresses = Object.keys(machine.dataMemory).map(Number);
            const dataMemory =
                addresses.length > 0
                    ? Object.fromEntries(
                          addresses.map((address) => [address, 0]),
                      )
                    : createZeroedDataMemory();
            return { ...machine, dataMemory };
        });
        setMachineHighlight(emptyHighlight);
    }

    return {
        machine,
        machineHighlight,
        program,
        programIndex,
        programLoaded,
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
    };
}
