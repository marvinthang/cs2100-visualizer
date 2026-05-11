import type { MipsInstructionFields, MipsMnemonic } from '../../../types/mips';

export type EncodedField = {
    bin: string;
    hex: string;
    dec: string;
};

export type EncodedInstruction = {
    opcode: EncodedField;
    rs: EncodedField;
    rt: EncodedField;
    rd: EncodedField;
    shamt: EncodedField;
    funct: EncodedField;
    immediate: EncodedField;
    address: EncodedField;
    full: EncodedField;
};

const opcodeMap: Record<MipsMnemonic, number> = {
    add: 0x00,
    sub: 0x00,
    and: 0x00,
    or: 0x00,
    nor: 0x00,
    slt: 0x00,
    sll: 0x00,
    srl: 0x00,

    addi: 0x08,
    andi: 0x0c,
    ori: 0x0d,
    lui: 0x0f,

    beq: 0x04,
    bne: 0x05,

    lw: 0x23,
    sw: 0x2b,

    j: 0x02,
};

const functMap: Partial<Record<MipsMnemonic, number>> = {
    add: 0x20,
    sub: 0x22,
    and: 0x24,
    or: 0x25,
    nor: 0x27,
    slt: 0x2a,
    sll: 0x00,
    srl: 0x02,
};

export function encodeMipsInstructionWord(
    instruction: MipsInstructionFields,
): number {
    const opcode = opcodeMap[instruction.mnemonic];

    if (instruction.mnemonic === 'j') {
        if (instruction.address === undefined) {
            throw new Error(
                `Missing address for instruction: ${instruction.mnemonic}`,
            );
        }
        return (opcode << 26) | (instruction.address & 0x03ffffff);
    }

    if (opcode === 0) {
        const rs =
            instruction.mnemonic === 'sll' || instruction.mnemonic === 'srl'
                ? 0
                : (instruction.rs ?? 0);
        const rt = instruction.rt ?? 0;
        const rd = instruction.rd ?? 0;
        const shamt =
            instruction.mnemonic === 'sll' || instruction.mnemonic === 'srl'
                ? (instruction.shamt ?? 0)
                : 0;
        const funct = functMap[instruction.mnemonic] ?? 0;

        return (
            ((opcode << 26) |
                (rs << 21) |
                (rt << 16) |
                (rd << 11) |
                (shamt << 6) |
                funct) >>>
            0
        );
    }

    const rs = instruction.mnemonic === 'lui' ? 0 : (instruction.rs ?? 0);
    const rt = instruction.rt ?? 0;
    const immediate = instruction.immediate & 0xffff;

    return ((opcode << 26) | (rs << 21) | (rt << 16) | immediate) >>> 0;
}

export function encodeField(value: number, bits: number): EncodedField {
    const normalized = bits === 32 ? value >>> 0 : value & ((1 << bits) - 1);

    return {
        bin: normalized.toString(2).padStart(bits, '0'),
        hex:
            '0x' +
            normalized
                .toString(16)
                .padStart(Math.ceil(bits / 4), '0')
                .toUpperCase(),
        dec: normalized.toString(),
    };
}

export function encodeMipsInstruction(
    instruction: MipsInstructionFields,
): EncodedInstruction {
    const word = encodeMipsInstructionWord(instruction);
    return {
        opcode: encodeField(word >>> 26, 6),
        rs: encodeField(word >>> 21, 5),
        rt: encodeField(word >>> 16, 5),
        rd: encodeField(word >>> 11, 5),
        shamt: encodeField(word >>> 6, 5),
        funct: encodeField(word, 6),
        immediate: encodeField(word, 16),
        address: encodeField(word, 26),
        full: encodeField(word, 32),
    };
}
