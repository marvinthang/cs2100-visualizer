export type BaseControlSignals = {
    RegDst: 0 | 1 | 'X';
    ALUSrc: 0 | 1;
    MemToReg: 0 | 1 | 'X';
    RegWrite: 0 | 1;
    MemRead: 0 | 1;
    MemWrite: 0 | 1;
    Branch: 0 | 1;
    BranchNE: 0 | 1;
    ALUOp: '00' | '01' | '10';
};

export type RuntimeControlSignals = BaseControlSignals & {
    PCSrc?: 0 | 1;
};

export type MuxControlSignal = 'RegDst' | 'ALUSrc' | 'MemToReg' | 'PCSrc';

export type ControlSignalId = keyof RuntimeControlSignals;
