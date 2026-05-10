import type { ControlSignals, DatapathInstructionFields, DatapathStage } from '../../types/mips';
import type { ExecutionContext } from './executionContext';
import {
    readRegister,
    readWord,
    writeRegister,
    writeWord,
    type MachineState,
} from './machineState';

export type StepExecutionResult = {
    machineState: MachineState;
    executionContext: ExecutionContext;
    warnings: string[];
};

function getBitSignal(signals: ControlSignals, name: keyof ControlSignals, warnings: string[]): 0 | 1 | undefined {
    const value = signals[name];
    if (value === 0 || value === 1) {
        return value;
    }
    warnings.push(`Control signal ${name} is undefined (X)`);
    return undefined;
}

function getALUOperation(instruction: DatapathInstructionFields, signals: ControlSignals, warnings: string[]): 'add' | 'sub' | 'and' | 'or' | 'slt' | undefined {
    const aluOp = signals.ALUOp ?? '';
    switch (aluOp) {
        case '00':
            return 'add';
        case '01':
            return 'sub';
        case '10':
            switch (instruction.funct) {
                case 32:
                    return 'add';
                case 34:
                    return 'sub';
                case 36:
                    return 'and';
                case 37:
                    return 'or';
                case 42:
                    return 'slt';
                default:
                    warnings.push(`Unknown funct code ${instruction.funct} for R-type instruction`);
                    return undefined;
            }
        default:
            warnings.push(`Unknown ALU operation ${aluOp}`);
            return undefined;
    }
}

function computeALUResult(op: 'add' | 'sub' | 'and' | 'or' | 'slt', op1: number, op2: number): number {
    switch (op) {
        case 'add':
            return op1 + op2;
        case 'sub':
            return op1 - op2;
        case 'and':
            return op1 & op2;
        case 'or':
            return op1 | op2;
        case 'slt':
            return op1 < op2 ? 1 : 0;
    }
}

export default function executeDatapathStep(
    machineState: MachineState,
    context: ExecutionContext,
    instruction: DatapathInstructionFields,
    signals: ControlSignals,
    stage: DatapathStage,
    shouldCommit: boolean,
): StepExecutionResult {
    const warnings: string[] = [];
    let newMachineState = machineState;
    let newContext = context;

    if (stage == 'IF') {
        newContext = {
            ...context,
            instruction,
            pcPlus4: machineState.pc + 4,
        };
    } else if (stage == 'ID') {
        const RegDst = getBitSignal(signals, 'RegDst', warnings);
        const readReg1 = instruction.rs;
        const readReg2 = instruction.rt;
        const readData1 = readRegister(machineState, readReg1);
        const readData2 = readRegister(machineState, readReg2);
        const writeReg = RegDst === undefined ? undefined : (RegDst === 0 ? instruction.rt : instruction.rd);
        newContext = {
            ...context,
            instruction,
            readReg1,
            readReg2,
            readData1,
            readData2,
            writeReg: writeReg,
            immediate: instruction.immediate,
        };
    } else if (stage == 'EX') {
        const aluSrc = getBitSignal(signals, 'ALUSrc', warnings);
        const aluOp1 = context.readData1;
        const aluOp2 = aluSrc === undefined ? undefined : (aluSrc === 0 ? context.readData2 : context.immediate);
        const op = getALUOperation(instruction, signals, warnings);

        const aluResult = op !== undefined && aluOp2 !== undefined && aluOp1 !== undefined? computeALUResult(op, aluOp1, aluOp2) : undefined;

        const isZero = aluResult !== undefined ? aluResult === 0 : undefined;
        const branchTarget = context.pcPlus4 !== undefined && context.immediate !== undefined ? context.pcPlus4 + (context.immediate << 2) : undefined;

        newContext = {
            ...context,
            aluOp1,
            aluOp2,
            aluResult,
            isZero,
            branchTarget,
        };
    } else if (stage == 'MEM') {
        const memRead = getBitSignal(signals, 'MemRead', warnings);
        const memWrite = getBitSignal(signals, 'MemWrite', warnings);

        const memAddress = context.aluResult;
        const memWriteData = context.readData2;
        newContext = {
            ...context,
            memAddress,
            memWriteData,
        };

        if (memRead === 1 && memWrite === 1) {
            warnings.push('Cannot read and write memory at the same time');
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }
        if (memRead === 1 && memAddress !== undefined) {
            if (memAddress % 4 !== 0) {
                warnings.push(`Memory address ${memAddress} is not word-aligned`);
            }
            newContext = {
                ...newContext,
                memReadData: readWord(machineState, memAddress),
                memWriteData: context.readData2,
            };
        }
        if (memWrite === 1 && memAddress !== undefined) {
            if (memAddress % 4 !== 0) {
                warnings.push(`Memory address ${memAddress} is not word-aligned`);
            }

        }
        if (memWrite === 1 && memAddress !== undefined && context.readData2 !== undefined && shouldCommit) {
            newMachineState = writeWord(machineState, memAddress, context.readData2);
        }

        const branch = getBitSignal(signals, 'Branch', warnings);
        const branchNE = getBitSignal(signals, 'BranchNE', warnings);

        if (branch === undefined || branchNE === undefined) {
            warnings.push('Branch control signals are not fully defined');
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }

        const isZero = context.isZero;

        if ((branch === 1 || branchNE === 1) && isZero === undefined) {
            warnings.push('ALU result is not available to determine branch outcome');
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }

        const branchTaken = (branch === 1 && isZero) || (branchNE === 1 && !isZero);
        const nextPc = branchTaken ? context.branchTarget : context.pcPlus4;
        newContext = {
            ...newContext,
            branchTaken,
            nextPc,
        };

        if (nextPc === undefined) {
            warnings.push('Next PC is not defined due to missing branch target or PC+4');
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }

        if (shouldCommit) {
            newMachineState = {
                ...newMachineState,
                pc: nextPc ?? 0,
            };
        }
    } else if (stage == 'WB') {
        
        const memToReg = getBitSignal(signals, 'MemToReg', warnings);
        const regWrite = getBitSignal(signals, 'RegWrite', warnings);
        const writeReg = context.writeReg;

        if (memToReg === undefined) {
            warnings.push('MemToReg control signal is not defined');
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }
        
        const regWriteData = memToReg === 1 ? context.memReadData : context.aluResult;

        newContext = {
            ...newContext,
            writeData: regWriteData,
        };
        
        if (regWrite === undefined) {
            warnings.push('RegWrite control signal is not defined');
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }
        
        if (regWrite === 0) {
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }
        
        if (writeReg === undefined) {
            warnings.push('Write register is not defined');
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }


        if (regWriteData === undefined) {
            warnings.push('Write data is not available from ALU result or memory read');
            return {
                machineState,
                executionContext: newContext,
                warnings
            };
        }

        if (shouldCommit) {
            newMachineState = writeRegister(machineState, writeReg, regWriteData);
        }

    } else {
        warnings.push(`Unknown stage ${stage}`);
    }
    return {
        machineState: newMachineState,
        executionContext: newContext,
        warnings
    };
}