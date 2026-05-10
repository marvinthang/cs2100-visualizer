import type { ControlSignals, DatapathMnemonic } from "../../types/mips";

const rTypeControl: ControlSignals = {
    RegDst: 1,
    ALUSrc: 0,
    MemToReg: 0,
    RegWrite: 1,
    MemRead: 0,
    MemWrite: 0,
    Branch: 0,
    BranchNE: 0,
    ALUOp: '10',
};

const addiControl: ControlSignals = {
    RegDst: 0,
    ALUSrc: 1,
    MemToReg: 0,
    RegWrite: 1,
    MemRead: 0,
    MemWrite: 0,
    Branch: 0,
    BranchNE: 0,
    ALUOp: '00',
};

const beqControl: ControlSignals = {
    RegDst: 'X',
    ALUSrc: 0,
    MemToReg: 'X',
    RegWrite: 0,
    MemRead: 0,
    MemWrite: 0,
    Branch: 1,
    BranchNE: 0,
    ALUOp: '01',
};

const bneControl: ControlSignals = {
    RegDst: 'X',
    ALUSrc: 0,
    MemToReg: 'X',
    RegWrite: 0,
    MemRead: 0,
    MemWrite: 0,
    Branch: 0,
    BranchNE: 1,
    ALUOp: '01',
};

const lwControl: ControlSignals = {
    RegDst: 0,
    ALUSrc: 1,
    MemToReg: 1,
    RegWrite: 1,
    MemRead: 1,
    MemWrite: 0,
    Branch: 0,
    BranchNE: 0,
    ALUOp: '00',
};

const swControl: ControlSignals = {
    RegDst: 'X',
    ALUSrc: 1,
    MemToReg: 'X',
    RegWrite: 0,
    MemRead: 0,
    MemWrite: 1,
    Branch: 0,
    BranchNE: 0,
    ALUOp: '00',
};

export const datapathControlTable: Record<DatapathMnemonic, ControlSignals> = {
    add: rTypeControl,
    addi: addiControl,
    and: rTypeControl,
    beq: beqControl,
    bne: bneControl,
    lw: lwControl,
    slt: rTypeControl,
    or: rTypeControl,
    sw: swControl,
    sub: rTypeControl,
};

export function getDatapathControlSignals(mnemonic: DatapathMnemonic): ControlSignals {
    return datapathControlTable[mnemonic];
}