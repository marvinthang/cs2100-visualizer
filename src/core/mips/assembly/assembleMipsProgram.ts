import type { MipsInstructionFields } from '../../../types/mips';
import {
    parseMipsProgram,
    type ParseMipsResult,
} from './parseMipsProgram';
import type { ParseError } from './parseAssembly';

export type AssembledMipsInstruction = {
    index: number; // program order; byte address is index * 4
    line: number; // 1-based source line number
    text: string; // original source text
    fields: MipsInstructionFields;
};

export type AssembleMipsResult = {
    instructions: AssembledMipsInstruction[];
    errors: ParseError[];
};

// Resolve a branch/jump label to a concrete field value. Branches store a word
// offset relative to the next instruction (offset = target - (current + 1));
// jumps store the absolute target index. Returns the resolved fields, or an
// error message if the label is undefined.
function resolveLabels(
    fields: MipsInstructionFields,
    currentIndex: number,
    labels: ParseMipsResult['labels'],
): MipsInstructionFields | string {
    if (fields.label === undefined) {
        return fields;
    }

    if (!(fields.label in labels)) {
        return `undefined label: ${fields.label}`;
    }

    const targetIndex = labels[fields.label];

    if (fields.mnemonic === 'j') {
        return { ...fields, address: targetIndex };
    }

    return { ...fields, immediate: targetIndex - (currentIndex + 1) };
}

// Assemble source into an executable instruction list, resolving every label.
// Parse and resolution errors are returned together.
export function assembleMipsProgram(source: string): AssembleMipsResult {
    const parsed = parseMipsProgram(source);
    const errors = [...parsed.errors];
    const instructions: AssembledMipsInstruction[] = [];

    parsed.instructions.forEach((instruction, index) => {
        const resolved = resolveLabels(
            instruction.fields,
            index,
            parsed.labels,
        );

        if (typeof resolved === 'string') {
            errors.push({ line: instruction.line, message: resolved });
            return;
        }

        instructions.push({
            index,
            line: instruction.line,
            text: instruction.text,
            fields: resolved,
        });
    });

    return { instructions, errors };
}
