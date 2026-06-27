// Runs the program so we get the real list of executed instructions (loops
// repeat). Each step remembers if a branch jumped. There is a step cap so an
// infinite loop doesn't run forever.

import type { MipsInstructionFields } from '../../types/mips';
import { assembleMipsProgram } from '../mips/assembly/assembleMipsProgram';
import type { ParseError } from '../mips/assembly/parseAssembly';
import { executeInstruction } from '../mips/execution/executeInstruction';
import {
    createInitialMachineState,
    type MachineState,
} from '../mips/single-cycle/execution/machineState';

export interface TraceStep {
    text: string;
    line: number; // 1-based source line this instruction is on
    fields: MipsInstructionFields;
    isControl: boolean; // branch or jump
    isJump: boolean; // the j instruction
    taken: boolean; // did the branch jump this time
    machine: MachineState; // registers + memory after this instruction runs
}

export interface ExecutionTrace {
    steps: TraceStep[];
    truncated: boolean; // hit the step cap (probably an infinite loop)
    errors: ParseError[]; // lines that could not be assembled
}

// don't trace more than this many instructions
const DEFAULT_MAX_STEPS = 64;

function isControlMnemonic(mnemonic: string): boolean {
    return mnemonic === 'beq' || mnemonic === 'bne' || mnemonic === 'j';
}

export function buildExecutionTrace(
    source: string,
    maxSteps: number = DEFAULT_MAX_STEPS,
    initialState?: MachineState,
): ExecutionTrace {
    const assembled = assembleMipsProgram(source);
    const byIndex = new Map(assembled.instructions.map((i) => [i.index, i]));

    const steps: TraceStep[] = [];
    // start from the user-supplied registers/memory (pc reset to 0)
    let machine = initialState
        ? { ...initialState, pc: 0 }
        : createInitialMachineState();
    let truncated = false;

    while (true) {
        const index = machine.pc / 4;
        const instruction = byIndex.get(index);
        if (!instruction) {
            break; // ran past the last instruction — program done
        }
        if (steps.length >= maxSteps) {
            truncated = true;
            break;
        }

        const next = executeInstruction(machine, instruction.fields);
        const isControl = isControlMnemonic(instruction.fields.mnemonic);
        const isJump = instruction.fields.mnemonic === 'j';
        const taken = isControl && next.pc !== machine.pc + 4;

        steps.push({
            text: instruction.text,
            line: instruction.line,
            fields: instruction.fields,
            isControl,
            isJump,
            taken,
            machine: next,
        });
        machine = next;
    }

    return { steps, truncated, errors: assembled.errors };
}
