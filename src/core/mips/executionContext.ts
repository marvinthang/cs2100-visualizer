import type { DatapathInstructionFields, RegisterNumber } from '../../types/mips';

export type ExecutionContext = {
    instruction?: DatapathInstructionFields;
    pcPlus4?: number;
    regData1?: number;
    regData2?: number;
    immediate?: number;
    aluOp1?: number;
    aluOp2?: number;
    aluResult?: number;
    isZero?: boolean;
    branchTarget?: number;
    memReadData?: number;
    writeRegister?: RegisterNumber;
    writeData?: number;
    nextPc?: number;
};

export function createEmptyExecutionContext(): ExecutionContext {
    return {};
}