import type {
    EncodedInstruction,
    MipsInstructionFields,
    MipsMnemonic,
} from '../../../types/mips';

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

function trimBinary(value: number, bits: number): string {
    const mask = (1 << bits) - 1;
    return (value & mask).toString(2).padStart(bits, '0');
}

export function encodeMipsInstruction(
    instruction: MipsInstructionFields,
): EncodedInstruction {
    const word = encodeMipsInstructionWord(instruction);
    return {
        opcode: trimBinary(word >>> 26, 6),
        rs: trimBinary(word >>> 21, 5),
        rt: trimBinary(word >>> 16, 5),
        rd: trimBinary(word >>> 11, 5),
        shamt: trimBinary(word >>> 6, 5),
        funct: trimBinary(word, 6),
        immediate: trimBinary(word, 16),
        address: trimBinary(word, 26),
        full: trimBinary(word, 32),
        hex: '0x' + word.toString(16).padStart(8, '0'),
    };
}
