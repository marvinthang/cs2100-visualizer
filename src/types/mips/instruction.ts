import type { RegisterNumber } from './register';

export type MipsMnemonic =
    | 'add'
    | 'addi'
    | 'and'
    | 'andi'
    | 'beq'
    | 'bne'
    | 'j'
    | 'lui'
    | 'lw'
    | 'or'
    | 'ori'
    | 'nor'
    | 'slt'
    | 'sll'
    | 'srl'
    | 'sw'
    | 'sub';

export type DatapathMnemonic =
    | 'add'
    | 'addi'
    | 'and'
    | 'beq'
    | 'bne'
    | 'lw'
    | 'slt'
    | 'or'
    | 'sw'
    | 'sub';

export type InstructionFields<TMnemonic extends MipsMnemonic> = {
    mnemonic: TMnemonic;
    rs: RegisterNumber;
    rt: RegisterNumber;
    rd: RegisterNumber;
    immediate: number;
    shamt?: number;
    funct?: number;
    label?: string;
    address?: number;
};

export type MipsInstructionFields = InstructionFields<MipsMnemonic>;

export type DatapathInstructionFields = InstructionFields<DatapathMnemonic>;
