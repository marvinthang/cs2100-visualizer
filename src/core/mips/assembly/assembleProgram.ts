import type { DatapathInstructionFields } from '../../../types/mips';
import { encodeMipsInstructionWord } from '../instruction/encodeMipsInstruction';
import {
    parseAssembly,
    type ParseError,
    type ParseResult,
} from './parseAssembly';

export type AssembledInstruction = {
    index: number; // program order; byte address is index * 4
    line: number; // 1-based source line number
    text: string; // original source text
    fields: DatapathInstructionFields;
    word: number; // encoded 32-bit machine word
};

export type AssembleResult = {
    instructions: AssembledInstruction[];
    errors: ParseError[];
};

// Resolve a branch to its word offset relative to the next instruction. The
// datapath computes the target as (pc + 4) + (offset << 2), and instruction i
// lives at byte address i * 4, so offset = targetIndex - (currentIndex + 1).
function resolveBranchOffset(
    fields: DatapathInstructionFields,
    currentIndex: number,
    labels: ParseResult['labels'],
): number | string {
    const label = fields.label;
    if (label === undefined) {
        return fields.immediate;
    }

    if (!(label in labels)) {
        return `undefined label: ${label}`;
    }

    return labels[label] - (currentIndex + 1);
}

// Assemble source text into an executable instruction list. Parses the source,
// resolves branch labels to offsets, and encodes each instruction to a machine
// word. Parse and resolution errors are returned together.
export function assembleProgram(source: string): AssembleResult {
    const parsed = parseAssembly(source);
    const errors = [...parsed.errors];
    const instructions: AssembledInstruction[] = [];

    parsed.instructions.forEach((instruction, index) => {
        const offset = resolveBranchOffset(
            instruction.fields,
            index,
            parsed.labels,
        );

        if (typeof offset === 'string') {
            errors.push({ line: instruction.line, message: offset });
            return;
        }

        const fields: DatapathInstructionFields = {
            ...instruction.fields,
            immediate: offset,
        };

        instructions.push({
            index,
            line: instruction.line,
            text: instruction.text,
            fields,
            word: encodeMipsInstructionWord(fields),
        });
    });

    return { instructions, errors };
}
