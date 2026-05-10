import type { DatapathMnemonic, MipsMnemonic } from '../../types/mips';

export const mipsMnemonics: MipsMnemonic[] = [
    'add',
    'addi',
    'and',
    'andi',
    'beq',
    'bne',
    'j',
    'lui',
    'lw',
    'nor',
    'or',
    'ori',
    'slt',
    'sll',
    'srl',
    'sw',
    'sub',
    'xor',
    'xori'
];

export const datapathMnemonics: DatapathMnemonic[] = [
    'add',
    'addi',
    'and',
    'beq',
    'bne',
    'lw',
    'slt',
    'or',
    'sw',
    'sub'
];

export function isMipsMnemonic(mnemonic: string): mnemonic is MipsMnemonic {
    return mipsMnemonics.includes(mnemonic as MipsMnemonic);
}

export function isDatapathMnemonic(mnemonic: string): mnemonic is DatapathMnemonic {
    return datapathMnemonics.includes(mnemonic as DatapathMnemonic);
}