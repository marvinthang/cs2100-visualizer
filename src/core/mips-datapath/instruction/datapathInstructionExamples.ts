import type {
    DatapathInstructionFields,
    DatapathMnemonic,
} from '../../../types/mips';

export const datapathInstructionExamples: Record<
    DatapathMnemonic,
    DatapathInstructionFields
> = {
    add: {
        mnemonic: 'add',
        rs: 9,
        rt: 10,
        rd: 8,
        immediate: 0,
        funct: 32,
    },
    sub: {
        mnemonic: 'sub',
        rs: 9,
        rt: 10,
        rd: 8,
        immediate: 0,
        funct: 34,
    },
    and: {
        mnemonic: 'and',
        rs: 9,
        rt: 10,
        rd: 8,
        immediate: 0,
        funct: 36,
    },
    or: {
        mnemonic: 'or',
        rs: 9,
        rt: 10,
        rd: 8,
        immediate: 0,
        funct: 37,
    },
    slt: {
        mnemonic: 'slt',
        rs: 9,
        rt: 10,
        rd: 8,
        immediate: 0,
        funct: 42,
    },
    addi: {
        mnemonic: 'addi',
        rs: 9,
        rt: 8,
        rd: 0,
        immediate: 4,
    },
    lw: {
        mnemonic: 'lw',
        rs: 9,
        rt: 8,
        rd: 0,
        immediate: 4,
    },
    sw: {
        mnemonic: 'sw',
        rs: 9,
        rt: 8,
        rd: 0,
        immediate: 4,
    },
    beq: {
        mnemonic: 'beq',
        rs: 8,
        rt: 9,
        rd: 0,
        immediate: 8,
        label: 'target',
    },
    bne: {
        mnemonic: 'bne',
        rs: 8,
        rt: 9,
        rd: 0,
        immediate: 8,
        label: 'target',
    },
};
