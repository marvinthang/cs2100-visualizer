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
        const regData1 = readRegister(machineState, instruction.rs);
        const regData2 = readRegister(machineState, instruction.rt);
        const writeReg = RegDst === undefined ? undefined : (RegDst === 0 ? instruction.rt : instruction.rd);
        newContext = {
            ...context,
            instruction,
            regData1,
            regData2,
            writeRegister: writeReg,
            immediate: instruction.immediate,
        };
    } else if (stage == 'EX') {
        const aluSrc = getBitSignal(signals, 'ALUSrc', warnings);
        const aluOp1 = context.regData1;
        const aluOp2 = aluSrc === undefined ? undefined : (aluSrc === 0 ? context.regData2 : context.immediate);
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

        const address = context.aluResult;
        if (memRead === 1 && memWrite === 1) {
            warnings.push('Cannot read and write memory at the same time');
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }
        if (memRead === 1 && address !== undefined) {
            newContext = {
                ...context,
                memReadData: readWord(machineState, address),
            };
        }
        if (memWrite === 1 && address !== undefined && context.regData2 !== undefined && shouldCommit) {
            newMachineState = writeWord(machineState, address, context.regData2);
        }

        const branch = getBitSignal(signals, 'Branch', warnings);
        const branchNE = getBitSignal(signals, 'BranchNE', warnings);

        if (branch === undefined || branchNE === undefined) {
            warnings.push('Branch control signals are not fully defined');
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }

        const isZero = context.isZero;

        if ((branch === 1 || branchNE === 1) && isZero === undefined) {
            warnings.push('ALU result is not available to determine branch outcome');
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }

        const branchTaken = (branch === 1 && isZero) || (branchNE === 1 && !isZero);
        const nextPc = branchTaken ? context.branchTarget : context.pcPlus4;

        if (nextPc === undefined) {
            warnings.push('Next PC is not defined due to missing branch target or PC+4');
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }
        newContext = {
            ...newContext,
            nextPc,
        };

        if (shouldCommit) {
            newMachineState = {
                ...newMachineState,
                pc: nextPc ?? 0,
            };
        }
    } else if (stage == 'WB') {
        const regWrite = getBitSignal(signals, 'RegWrite', warnings);
        
        if (regWrite === undefined) {
            warnings.push('RegWrite control signal is not defined');
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }
        
        if (regWrite === 0) {
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }
        
        const memToReg = getBitSignal(signals, 'MemToReg', warnings);
        const writeReg = context.writeRegister;
        
        if (writeReg === undefined) {
            warnings.push('Write register is not defined');
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }

        if (memToReg === undefined) {
            warnings.push('MemToReg control signal is not defined');
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }

        const writeData = memToReg === 1 ? context.memReadData : context.aluResult;

        if (writeData === undefined) {
            warnings.push('Write data is not available from ALU result or memory read');
            return {
                machineState,
                executionContext: context,
                warnings
            };
        }

        if (shouldCommit) {
            newMachineState = writeRegister(machineState, writeReg, writeData);
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