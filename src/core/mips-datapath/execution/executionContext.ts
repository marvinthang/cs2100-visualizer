import type {
    DatapathInstructionFields,
    RegisterNumber,
} from '../../../types/mips';

export type ExecutionContext = {
    instruction?: DatapathInstructionFields;
    pcPlus4?: number;
    readReg1?: RegisterNumber;
    readReg2?: RegisterNumber;
    writeReg?: RegisterNumber;
    readData1?: number;
    readData2?: number;
    immediate?: number;
    aluOp1?: number;
    aluOp2?: number;
    aluResult?: number;
    isZero?: boolean;
    branchTarget?: number;
    memAddress?: number;
    memReadData?: number;
    memWriteData?: number;
    writeData?: number;
    nextPc?: number;
    branchTaken?: boolean;
    logs: string[];
};

export function createEmptyExecutionContext(): ExecutionContext {
    return {
        logs: [],
    };
}
