import type {
    ControlSignalId,
    RuntimeControlSignals,
    DatapathInstructionFields,
    DatapathStep,
} from '../../../types/mips';
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
    signals: RuntimeControlSignals;
};

type ExecutionFrame = {
    machineState: MachineState;
    context: ExecutionContext;
    instruction: DatapathInstructionFields;
    signals: RuntimeControlSignals;
    shouldCommit: boolean;

    warnings: string[];
    newMachineState: MachineState;
    newContext: ExecutionContext;
    newSignals: RuntimeControlSignals;
};

function toHex(num: number | undefined): string {
    if (num === undefined) {
        return 'UNDEFINED';
    }
    return `0x${(num >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function getBitSignal(
    signals: RuntimeControlSignals,
    name: ControlSignalId,
    warnings: string[],
): 0 | 1 | undefined {
    const value = signals[name];
    if (value === 0 || value === 1) {
        return value;
    }
    void warnings;
    return undefined;
}

function getALUOperation(
    instruction: DatapathInstructionFields,
    signals: RuntimeControlSignals,
    warnings: string[],
): 'add' | 'sub' | 'and' | 'or' | 'slt' | undefined {
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
                    warnings.push(
                        `[EX FAULT] Unsupported R-type funct=${instruction.funct}; ALU result is undefined.`,
                    );
                    return undefined;
            }
        default:
            warnings.push(`[EX FAULT] Unsupported ALUOp=${aluOp}.`);
            return undefined;
    }
}

function computeALUResult(
    op: 'add' | 'sub' | 'and' | 'or' | 'slt',
    op1: number,
    op2: number,
): number {
    switch (op) {
        case 'add':
            return (op1 + op2) | 0;
        case 'sub':
            return (op1 - op2) | 0;
        case 'and':
            return (op1 & op2) | 0;
        case 'or':
            return op1 | op2 | 0;
        case 'slt':
            return op1 < op2 ? 1 : 0;
    }
}

function executeIF(frame: ExecutionFrame): void {
    const pcPlus4 = frame.machineState.pc + 4;
    frame.newContext = {
        ...frame.context,
        instruction: frame.instruction,
        pcPlus4,
        logs: [
            ...frame.context.logs,
            `=== [IF] INSTRUCTION FETCH ===`,
            `├─ PC        = ${toHex(frame.machineState.pc)}`,
            `├─ Instr     = ${frame.instruction.mnemonic}`,
            `└─ PC + 4    = ${toHex(pcPlus4)}`,
        ],
    };
}

function executeID(frame: ExecutionFrame): void {
    const RegDst = getBitSignal(frame.signals, 'RegDst', frame.warnings);
    const readReg1 = frame.instruction.rs;
    const readReg2 = frame.instruction.rt;
    const readData1 = readRegister(frame.machineState, readReg1);
    const readData2 = readRegister(frame.machineState, readReg2);
    const writeReg =
        RegDst === undefined
            ? undefined
            : RegDst === 0
              ? frame.instruction.rt
              : frame.instruction.rd;
    frame.newContext = {
        ...frame.context,
        readReg1,
        readReg2,
        readData1,
        readData2,
        writeReg: writeReg,
        immediate: frame.instruction.immediate,
        logs: [
            ...frame.context.logs,
            `=== [ID] INSTRUCTION DECODE ===`,
            `├─ rs = $${readReg1} -> ${readData1} (${toHex(readData1)})`,
            `├─ rt = $${readReg2} -> ${readData2} (${toHex(readData2)})`,
            `├─ Write reg candidate (RegDst=${RegDst ?? 'X'}) -> $${writeReg ?? 'UNDEFINED'}`,
            `└─ Sign-extended imm -> ${frame.instruction.immediate} (${toHex(frame.instruction.immediate)})`,
        ],
    };
}

function executeEX(frame: ExecutionFrame): void {
    const aluSrc = getBitSignal(frame.signals, 'ALUSrc', frame.warnings);
    const aluOp1 = frame.context.readData1;
    const aluOp2 =
        aluSrc === undefined
            ? undefined
            : aluSrc === 0
              ? frame.context.readData2
              : frame.context.immediate;
    const op = getALUOperation(
        frame.instruction,
        frame.signals,
        frame.warnings,
    );

    const aluResult =
        op !== undefined && aluOp2 !== undefined && aluOp1 !== undefined
            ? computeALUResult(op, aluOp1, aluOp2)
            : undefined;

    const isZero = aluResult !== undefined ? aluResult === 0 : undefined;
    const branchTarget =
        frame.context.pcPlus4 !== undefined &&
        frame.context.immediate !== undefined
            ? frame.context.pcPlus4 + (frame.context.immediate << 2)
            : undefined;

    // if (aluSrc === undefined) {
    //     frame.warnings.push('[EX MUX FAULT] ALUSrc=X. ALU operand 2 is undefined.');
    // }

    const aluSrcChoice =
        aluSrc === 0 ? 'RegData' : aluSrc === 1 ? 'Immediate' : 'UNDEFINED';
    const zeroText =
        isZero === undefined ? 'UNDEFINED' : isZero ? 'TRUE (1)' : 'FALSE (0)';

    frame.newContext = {
        ...frame.context,
        aluOp1,
        aluOp2,
        aluResult,
        isZero,
        branchTarget,
        logs: [
            ...frame.context.logs,
            `=== [EX] EXECUTE ===`,
            `├─ ALUSrc=${aluSrc ?? 'X'} -> operand2 = ${aluSrcChoice}`,
            `├─ ALUOp=${frame.signals.ALUOp ?? 'X'} -> ${op?.toUpperCase() ?? 'X'}`,
            `├─ ALU input = ${aluOp1 ?? 'X'}, ${aluOp2 ?? 'X'}`,
            `├─ ALU result = ${aluResult ?? 'X'} (${toHex(aluResult)})`,
            `├─ Zero flag = ${zeroText}`,
            `└─ Branch target = ${toHex(branchTarget)}`,
        ],
    };
}

function executeMEM(frame: ExecutionFrame): void {
    const memRead = getBitSignal(frame.signals, 'MemRead', frame.warnings);
    const memWrite = getBitSignal(frame.signals, 'MemWrite', frame.warnings);

    const memAddress = frame.context.aluResult;
    const memWriteData = frame.context.readData2;

    frame.newContext = {
        ...frame.context,
        memAddress,
        memWriteData,
        logs: [
            ...frame.context.logs,
            `=== [MEM] DATA MEMORY ===`,
            `├─ Address input = ${toHex(memAddress)}`,
            `├─ Write data input = ${memWriteData ?? 'X'} (${toHex(memWriteData)})`,
        ],
    };

    if (memRead === undefined) {
        frame.warnings.push(
            '[MEM FAULT] MemRead=X; memory read decision is undefined.',
        );
        return;
    }

    if (memWrite === undefined) {
        frame.warnings.push(
            '[MEM FAULT] MemWrite=X; memory write decision is undefined.',
        );
        return;
    }

    if (memRead === 1 && memWrite === 1) {
        frame.warnings.push(
            '[MEM FAULT] MemRead=1 and MemWrite=1; data memory access is undefined.',
        );
        return;
    }

    if (memRead === 1) {
        if (memAddress === undefined) {
            frame.warnings.push(
                '[MEM FAULT] MemRead=1 but memory address is undefined.',
            );
            return;
        }

        if (memAddress % 4 !== 0) {
            frame.warnings.push(
                `[MEM FAULT] Unaligned read at ${toHex(memAddress)}; address must be word-aligned.`,
            );
            return;
        }

        const memReadData = readWord(frame.machineState, memAddress);

        frame.newContext = {
            ...frame.newContext,
            memReadData,
            logs: [
                ...frame.newContext.logs,
                `├─ Read [${toHex(memAddress)}] -> ${memReadData} (${toHex(memReadData)})`,
            ],
        };
    }

    if (memWrite === 1) {
        if (memAddress === undefined) {
            frame.warnings.push(
                '[MEM FAULT] MemWrite=1 but memory address is undefined.',
            );
            return;
        }

        if (memAddress % 4 !== 0) {
            frame.warnings.push(
                `[MEM FAULT] Unaligned write at ${toHex(memAddress)}; address must be word-aligned.`,
            );
            return;
        }

        if (memWriteData === undefined) {
            frame.warnings.push(
                '[MEM FAULT] MemWrite=1 but write data is undefined.',
            );
            return;
        }

        frame.newContext.logs = [
            ...frame.newContext.logs,
            `├─ Write ${memWriteData} (${toHex(memWriteData)}) -> [${toHex(memAddress)}]`,
        ];

        if (frame.shouldCommit) {
            frame.newMachineState = writeWord(
                frame.machineState,
                memAddress,
                memWriteData,
            );
        }
    }

    if (memRead === 0 && memWrite === 0) {
        frame.newContext.logs = [
            ...frame.newContext.logs,
            `└─ MemRead=0 and MemWrite=0 -> no memory access`,
        ];
        return;
    }
}

function executeBranch(frame: ExecutionFrame): void {
    const branch = getBitSignal(frame.signals, 'Branch', frame.warnings);
    const branchNE = getBitSignal(frame.signals, 'BranchNE', frame.warnings);

    const isZero = frame.context.isZero;

    if (branch === 1 && branchNE === 1) {
        frame.warnings.push(
            '[BRANCH WARN] Branch=1 and BranchNE=1; PCSrc is forced to 1, so branch is always taken.',
        );
    }

    if ((branch === 1 || branchNE === 1) && isZero === undefined) {
        frame.warnings.push(
            '[BRANCH FAULT] Branch control is active but Zero flag is undefined; PCSrc cannot be computed.',
        );
        return;
    }

    if (branch === undefined || branchNE === undefined) {
        frame.warnings.push(
            '[BRANCH FAULT] Branch=X or BranchNE=X; PCSrc is undefined.',
        );
        frame.newContext = {
            ...frame.newContext,
            nextPc: undefined,
            logs: [...frame.newContext.logs, '└─ Next PC Set = UNDEFINED'],
        };
        return;
    }

    const branchTaken = (branch === 1 && isZero) || (branchNE === 1 && !isZero);
    const nextPc = branchTaken
        ? frame.context.branchTarget
        : frame.context.pcPlus4;

    frame.newSignals['PCSrc'] = branchTaken ? 1 : 0;

    frame.newContext = {
        ...frame.newContext,
        branchTaken,
        nextPc,
        logs: [
            ...frame.newContext.logs,
            `├─ Branch ctrl = BEQ:${branch} BNE:${branchNE} | Zero:${isZero}`,
            `├─ PCSrc = ${branchTaken ? 1 : 0}`,
            `├─ Branch decision = ${branchTaken ? 'TAKEN' : 'NOT TAKEN'}`,
            `└─ Next PC = ${toHex(nextPc)}`,
        ],
    };

    if (nextPc === undefined) {
        frame.warnings.push(
            '[BRANCH FAULT] Next PC is undefined because PC+4 or branch target is missing.',
        );
        return;
    }

    if (frame.shouldCommit) {
        frame.newMachineState = {
            ...frame.newMachineState,
            pc: nextPc,
        };
    }
}

function executeWB(frame: ExecutionFrame): void {
    const memToReg = getBitSignal(frame.signals, 'MemToReg', frame.warnings);
    const regWrite = getBitSignal(frame.signals, 'RegWrite', frame.warnings);
    const writeReg = frame.context.writeReg;

    frame.newContext.logs = [
        ...frame.newContext.logs,
        `=== [WB] WRITE BACK ===`,
    ];

    if (regWrite === 1 && memToReg === undefined) {
        frame.warnings.push(
            '[WB FAULT] RegWrite=1 but MemToReg=X; write-back data source is undefined.',
        );
        return;
    }

    if (regWrite === undefined) {
        frame.warnings.push(
            '[WB FAULT] RegWrite=X; register write decision is undefined.',
        );
        return;
    }

    const regWriteData =
        memToReg === undefined
            ? undefined
            : memToReg === 1
              ? frame.context.memReadData
              : frame.context.aluResult;

    frame.newContext = {
        ...frame.newContext,
        writeData: regWriteData,
        logs: [
            ...frame.newContext.logs,
            `├─ MemToReg=${memToReg ?? 'X'} -> Write data = ${regWriteData ?? 'X'} (${toHex(regWriteData)})`,
        ],
    };

    if (regWrite === 0) {
        frame.newContext.logs = [
            ...frame.newContext.logs,
            '└─ RegWrite=0 -> no register write',
        ];
        return;
    }

    if (writeReg === undefined) {
        frame.warnings.push(
            '[WB FAULT] RegWrite=1 but target register is undefined.',
        );
        return;
    }

    if (regWriteData === undefined) {
        if (memToReg === 1) {
            frame.warnings.push(
                '[WB FAULT] MemToReg=1 but memory read data is undefined.',
            );
        } else {
            frame.warnings.push(
                '[WB FAULT] MemToReg=0 but ALU result is undefined.',
            );
        }
        return;
    }

    if (writeReg === 0) {
        frame.newContext.logs = [
            ...frame.newContext.logs,
            `└─ Ignored write to $zero; register $0 is hardwired to 0`,
        ];
        return;
    }

    frame.newContext.logs = [
        ...frame.newContext.logs,
        `└─ Write $${writeReg} <- ${regWriteData} (${toHex(regWriteData)})`,
    ];

    if (frame.shouldCommit) {
        frame.newMachineState = writeRegister(
            frame.newMachineState,
            writeReg,
            regWriteData,
        );
    }
}

export function executeDatapathStep(
    machineState: MachineState,
    context: ExecutionContext,
    instruction: DatapathInstructionFields,
    signals: RuntimeControlSignals,
    step: DatapathStep,
    shouldCommit: boolean,
): StepExecutionResult {
    const frame: ExecutionFrame = {
        machineState,
        context,
        instruction,
        signals,
        shouldCommit,

        warnings: [],
        newMachineState: machineState,
        newContext: { ...context },
        newSignals: { ...signals },
    };

    if (step === 'IF') {
        executeIF(frame);
    } else if (step === 'ID') {
        executeID(frame);
    } else if (step === 'EX') {
        executeEX(frame);
    } else if (step === 'MEM') {
        executeMEM(frame);
        executeBranch(frame);
    } else if (step === 'WB') {
        executeWB(frame);
    } else {
        frame.warnings.push(`[SYS FAULT] Unknown datapath step '${step}'.`);
    }
    return {
        machineState: frame.newMachineState,
        executionContext: frame.newContext,
        warnings: frame.warnings,
        signals: frame.newSignals,
    };
}
