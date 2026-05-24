import type { MipsInstructionFields, MipsMnemonic } from '../../../types/mips';
import { isMipsMnemonic } from '../instruction/instructionSet';
import { parseRegister } from '../instruction/registers';
import { parseImmediate, type ParseError } from './parseAssembly';

export type ParsedMipsInstruction = {
    line: number; // 1-based source line number
    text: string; // original source text for this instruction
    fields: MipsInstructionFields;
};

export type ParseMipsResult = {
    instructions: ParsedMipsInstruction[];
    labels: Record<string, number>; // label name -> index into instructions
    errors: ParseError[];
};

// funct codes for register-format instructions.
const rTypeFunct: Partial<Record<MipsMnemonic, number>> = {
    add: 0x20,
    sub: 0x22,
    and: 0x24,
    or: 0x25,
    nor: 0x27,
    slt: 0x2a,
};

const shiftFunct: Partial<Record<MipsMnemonic, number>> = {
    sll: 0x00,
    srl: 0x02,
};

const iTypeArithmetic: MipsMnemonic[] = ['addi', 'andi', 'ori'];

// Build instruction fields from a mnemonic and its operand tokens. Returns the
// fields on success, or an error message string describing what was wrong.
function parseStatement(
    mnemonic: MipsMnemonic,
    operands: string[],
): MipsInstructionFields | string {
    const fields: MipsInstructionFields = {
        mnemonic,
        rs: 0,
        rt: 0,
        rd: 0,
        immediate: 0,
    };

    // Register format: add/sub/and/or/nor/slt $rd, $rs, $rt
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

    // Shift format: sll/srl $rd, $rt, shamt
    if (mnemonic in shiftFunct) {
        if (operands.length !== 3) {
            return `${mnemonic} expects 3 operands: $rd, $rt, shamt`;
        }

        const rd = parseRegister(operands[0]);
        const rt = parseRegister(operands[1]);
        const shamt = parseImmediate(operands[2]);
        if (rd === null) return `invalid register: ${operands[0]}`;
        if (rt === null) return `invalid register: ${operands[1]}`;
        if (shamt === null || shamt < 0 || shamt > 31) {
            return `shift amount must be 0-31: ${operands[2]}`;
        }

        return { ...fields, rd, rt, shamt, funct: shiftFunct[mnemonic] };
    }

    // Immediate format: addi/andi/ori $rt, $rs, immediate
    if (iTypeArithmetic.includes(mnemonic)) {
        if (operands.length !== 3) {
            return `${mnemonic} expects 3 operands: $rt, $rs, immediate`;
        }

        const rt = parseRegister(operands[0]);
        const rs = parseRegister(operands[1]);
        const immediate = parseImmediate(operands[2]);
        if (rt === null) return `invalid register: ${operands[0]}`;
        if (rs === null) return `invalid register: ${operands[1]}`;
        if (immediate === null) return `invalid immediate: ${operands[2]}`;

        return { ...fields, rt, rs, immediate };
    }

    // Load upper immediate: lui $rt, immediate
    if (mnemonic === 'lui') {
        if (operands.length !== 2) {
            return 'lui expects 2 operands: $rt, immediate';
        }

        const rt = parseRegister(operands[0]);
        const immediate = parseImmediate(operands[1]);
        if (rt === null) return `invalid register: ${operands[0]}`;
        if (immediate === null) return `invalid immediate: ${operands[1]}`;

        return { ...fields, rt, immediate };
    }

    // Memory format: lw/sw $rt, offset($rs)
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

    // Branch format: beq/bne $rs, $rt, label (offset resolved by the assembler)
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

    // Jump format: j label (address resolved by the assembler)
    if (mnemonic === 'j') {
        if (operands.length !== 1) {
            return 'j expects 1 operand: label';
        }

        return { ...fields, label: operands[0] };
    }

    return `unsupported instruction: ${mnemonic}`;
}

// Parse assembly source text into a list of instructions, a label table, and
// any per-line errors. Comments (#...) are stripped; blank lines are skipped.
// A leading `label:` records the index of the instruction it points to.
export function parseMipsProgram(source: string): ParseMipsResult {
    const instructions: ParsedMipsInstruction[] = [];
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

        if (!isMipsMnemonic(mnemonicToken)) {
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
