import type {
    DatapathInstructionFields,
    DatapathMnemonic,
} from '../../../types/mips';
import { isDatapathMnemonic } from '../instruction/instructionSet';
import { parseRegister } from '../instruction/registers';

export type ParsedInstruction = {
    line: number; // 1-based source line number
    text: string; // original source text for this instruction
    fields: DatapathInstructionFields;
};

export type ParseError = {
    line: number;
    message: string;
};

export type ParseResult = {
    instructions: ParsedInstruction[];
    labels: Record<string, number>; // label name -> index into instructions
    errors: ParseError[];
};

// funct codes for the five datapath R-type instructions. Execution reads
// instruction.funct to pick the ALU operation, so the parser must set it.
const rTypeFunct: Partial<Record<DatapathMnemonic, number>> = {
    add: 0x20,
    sub: 0x22,
    and: 0x24,
    or: 0x25,
    slt: 0x2a,
};

// Resolve an immediate operand. Accepts decimal and 0x hex, both optionally
// signed. Returns null if the token is not a valid number.
function parseImmediate(token: string): number | null {
    const match = /^(-?)(0x[0-9a-fA-F]+|\d+)$/.exec(token);
    if (!match) {
        return null;
    }

    const sign = match[1] === '-' ? -1 : 1;
    return sign * Number(match[2]);
}

// Build instruction fields from a mnemonic and its operand tokens. Returns the
// fields on success, or an error message string describing what was wrong.
function parseStatement(
    mnemonic: DatapathMnemonic,
    operands: string[],
): DatapathInstructionFields | string {
    const fields: DatapathInstructionFields = {
        mnemonic,
        rs: 0,
        rt: 0,
        rd: 0,
        immediate: 0,
    };

    // R-type: add/sub/and/or/slt $rd, $rs, $rt
    if (mnemonic in rTypeFunct) {
        if (operands.length !== 3) {
            return `${mnemonic} expects 3 operands: $rd, $rs, $rt`;
        }

        const rd = parseRegister(operands[0]);
        const rs = parseRegister(operands[1]);
        const rt = parseRegister(operands[2]);
        if (rd === null) return `invalid register: ${operands[0]}`;
        if (rs === null) return `invalid register: ${operands[1]}`;
        if (rt === null) return `invalid register: ${operands[2]}`;

        return { ...fields, rd, rs, rt, funct: rTypeFunct[mnemonic] };
    }

    // I-type arithmetic: addi $rt, $rs, immediate
    if (mnemonic === 'addi') {
        if (operands.length !== 3) {
            return 'addi expects 3 operands: $rt, $rs, immediate';
        }

        const rt = parseRegister(operands[0]);
        const rs = parseRegister(operands[1]);
        const immediate = parseImmediate(operands[2]);
        if (rt === null) return `invalid register: ${operands[0]}`;
        if (rs === null) return `invalid register: ${operands[1]}`;
        if (immediate === null) return `invalid immediate: ${operands[2]}`;

        return { ...fields, rt, rs, immediate };
    }

    // Memory: lw/sw $rt, offset($rs)
    if (mnemonic === 'lw' || mnemonic === 'sw') {
        if (operands.length !== 2) {
            return `${mnemonic} expects 2 operands: $rt, offset($rs)`;
        }

        const rt = parseRegister(operands[0]);
        if (rt === null) return `invalid register: ${operands[0]}`;

        const memMatch = /^(-?(?:0x[0-9a-fA-F]+|\d+))\((\$[a-z0-9]+)\)$/i.exec(
            operands[1],
        );
        if (!memMatch) {
            return `expected offset($rs), got: ${operands[1]}`;
        }

        const immediate = parseImmediate(memMatch[1]);
        const rs = parseRegister(memMatch[2]);
        if (immediate === null) return `invalid offset: ${memMatch[1]}`;
        if (rs === null) return `invalid register: ${memMatch[2]}`;

        return { ...fields, rt, rs, immediate };
    }

    // Branch: beq/bne $rs, $rt, label (offset resolved by the assembler)
    if (mnemonic === 'beq' || mnemonic === 'bne') {
        if (operands.length !== 3) {
            return `${mnemonic} expects 3 operands: $rs, $rt, label`;
        }

        const rs = parseRegister(operands[0]);
        const rt = parseRegister(operands[1]);
        if (rs === null) return `invalid register: ${operands[0]}`;
        if (rt === null) return `invalid register: ${operands[1]}`;

        return { ...fields, rs, rt, label: operands[2] };
    }

    return `unsupported instruction: ${mnemonic}`;
}

// Parse assembly source text into a list of instructions, a label table, and
// any per-line errors. Comments (#...) are stripped; blank lines are skipped.
// A leading `label:` records the index of the instruction it points to.
export function parseAssembly(source: string): ParseResult {
    const instructions: ParsedInstruction[] = [];
    const labels: Record<string, number> = {};
    const errors: ParseError[] = [];

    const sourceLines = source.split('\n');

    for (let i = 0; i < sourceLines.length; i++) {
        const lineNumber = i + 1;

        // Drop comments and surrounding whitespace.
        let text = sourceLines[i].replace(/#.*$/, '').trim();
        if (text === '') {
            continue;
        }

        // Pull off a leading label, if present.
        const labelMatch = /^([A-Za-z_]\w*):\s*/.exec(text);
        if (labelMatch) {
            const name = labelMatch[1];
            if (name in labels) {
                errors.push({
                    line: lineNumber,
                    message: `duplicate label: ${name}`,
                });
            } else {
                labels[name] = instructions.length;
            }
            text = text.slice(labelMatch[0].length).trim();
            if (text === '') {
                continue;
            }
        }

        // Split into mnemonic and comma-separated operands.
        const spaceIndex = text.search(/\s/);
        const mnemonicToken =
            spaceIndex === -1 ? text : text.slice(0, spaceIndex);
        const operandText = spaceIndex === -1 ? '' : text.slice(spaceIndex);
        const operands = operandText
            .split(',')
            .map((operand) => operand.trim())
            .filter((operand) => operand !== '');

        if (!isDatapathMnemonic(mnemonicToken)) {
            errors.push({
                line: lineNumber,
                message: `unknown instruction: ${mnemonicToken}`,
            });
            continue;
        }

        const result = parseStatement(mnemonicToken, operands);
        if (typeof result === 'string') {
            errors.push({ line: lineNumber, message: result });
            continue;
        }

        instructions.push({ line: lineNumber, text, fields: result });
    }

    return { instructions, labels, errors };
}
