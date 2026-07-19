import type { DatapathStep } from '../../../../types/mips';
import {
    encodeField,
    encodeMipsInstruction,
    type EncodedField,
} from '../../instruction/encodeMipsInstruction';
import type { RuntimeControlSignals } from '../control/types';
import type { ExecutionContext } from '../execution/executionContext';
import type { MachineState } from '../execution/machineState';
import type { DatapathInspectID, DatapathInspectInfo } from './types';

export type InstructionDisplayFormat = 'hex' | 'bin' | 'dec';

type InspectInfoFrame = {
    id: DatapathInspectID;
    step: DatapathStep | null;
    machine: MachineState;
    context: ExecutionContext;
    signals: RuntimeControlSignals;
    instructionDisplayFormat: InstructionDisplayFormat;
    decToBaseN: (num: number | undefined, bits?: number) => string;
};

function toHex(num: number | undefined): string {
    if (num === undefined) {
        return 'UNDEFINED';
    }
    return `0x${(num >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function getUnsignedFieldValue(num: number, bits: 16 | 32): number {
    return bits === 16 ? num & 0xffff : num >>> 0;
}

function getSignedFieldValue(num: number, bits: 16 | 32): number {
    return bits === 16 ? (num << 16) >> 16 : num | 0;
}

function formatSignedField(
    num: number | undefined,
    bits: 16 | 32,
    format: InstructionDisplayFormat,
): string {
    if (num === undefined) {
        return 'UNDEFINED';
    }

    const unsignedValue = getUnsignedFieldValue(num, bits);

    if (format === 'hex') {
        return `0x${unsignedValue
            .toString(16)
            .padStart(bits / 4, '0')
            .toUpperCase()}`;
    }

    if (format === 'bin') {
        return unsignedValue.toString(2).padStart(bits, '0');
    }

    return `${getSignedFieldValue(num, bits)} (${formatSignedField(
        num,
        bits,
        'hex',
    )})`;
}

function getPCRole(step: DatapathStep | null): string {
    if (step === 'IF') {
        return 'Outputs the current instruction address.';
    }

    if (step === 'MEM') {
        return 'Will be updated by the PCSrc mux output.';
    }

    return 'Holds its current value.';
}

function getPCInspectInfo(frame: InspectInfoFrame): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'Program Counter (PC)',
        subtitle: 'Stores the address of the current instruction.',
        rows: [
            {
                label: 'Stored PC',
                value: toHex(frame.machine.pc),
            },
            {
                label: 'Current role',
                value: getPCRole(frame.step),
            },
        ],
    };
}

function getRepresentation(
    value: EncodedField | undefined,
    format: InstructionDisplayFormat,
): string {
    if (value === undefined) {
        return 'UNDEFINED';
    }

    switch (format) {
        case 'hex':
            return value.hex;
        case 'bin':
            return value.bin;
        case 'dec':
            return value.dec;
        default:
            return 'UNDEFINED';
    }
}

function getInstructionMemoryInspectInfo(
    frame: InspectInfoFrame,
): DatapathInspectInfo {
    if (frame.context.instruction === undefined) {
        return {
            id: frame.id,
            title: 'Instruction Memory',
            subtitle:
                'Uses the PC as an address and outputs the instruction stored there.',
            rows: [
                {
                    label: 'Fetched Instruction',
                    value: 'UNDEFINED',
                },
            ],
        };
    }

    const bits = encodeMipsInstruction(frame.context.instruction);
    return {
        id: frame.id,
        title: 'Instruction Memory',
        subtitle:
            'Uses the PC as an address and outputs the instruction stored there.',
        rows: [
            {
                label: 'Address input',
                value: toHex(frame.machine.pc),
            },
            {
                label:
                    frame.instructionDisplayFormat === 'hex'
                        ? 'Instruction hex'
                        : frame.instructionDisplayFormat === 'bin'
                          ? 'Instruction binary'
                          : 'Instruction decimal',
                value: getRepresentation(
                    bits?.full,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'IF'
                        ? 'Outputs the instruction at the current PC.'
                        : 'Keeps its output available but is not the active stage.',
            },
        ],
    };
}

function getInstructionRegisterInspectInfo(
    frame: InspectInfoFrame,
): DatapathInspectInfo {
    if (frame.context.instruction === undefined) {
        return {
            id: frame.id,
            title: 'Instruction Register',
            subtitle: 'Holds the instruction fetched from instruction memory.',
            rows: [
                {
                    label: 'Stored Instruction',
                    value: 'UNDEFINED',
                },
            ],
        };
    }

    const bits = encodeMipsInstruction(frame.context.instruction);

    return {
        id: frame.id,
        title: 'Instruction Register',
        subtitle:
            'Holds the fetched instruction and exposes its bit fields to the datapath.',
        rows: [
            {
                label: 'Opcode [31:26]',
                value: getRepresentation(
                    bits.opcode,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'RS [25:21]',
                value: getRepresentation(
                    bits.rs,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'RT [20:16]',
                value: getRepresentation(
                    bits.rt,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'RD [15:11]',
                value: getRepresentation(
                    bits.rd,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'Shamt [10:6]',
                value: getRepresentation(
                    bits.shamt,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'Funct [5:0]',
                value: getRepresentation(
                    bits.funct,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'Immediate [15:0]',
                value: getRepresentation(
                    bits.immediate,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'IF'
                        ? 'Receives the instruction from instruction memory.'
                        : frame.step === 'ID'
                          ? 'Outputs instruction fields to control, register file, and sign extend.'
                          : 'Keeps the current instruction fields available.',
            },
        ],
    };
}

function formatRegister(register: number | undefined): string {
    if (register === undefined) {
        return 'UNDEFINED';
    }
    return `$${register}`;
}

function getRegisterFileInspectInfo(
    frame: InspectInfoFrame,
): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'Register File',
        subtitle:
            'Reads two source registers and optionally writes one destination register.',
        rows: [
            {
                label: 'Read Reg 1',
                value: formatRegister(frame.context.readReg1),
            },
            {
                label: 'Read Reg 2',
                value: formatRegister(frame.context.readReg2),
            },
            {
                label: 'Write Reg',
                value: formatRegister(frame.context.writeReg),
            },
            {
                label: 'Read Data 1',
                value: frame.decToBaseN(frame.context.readData1),
            },
            {
                label: 'Read Data 2',
                value: frame.decToBaseN(frame.context.readData2),
            },
            {
                label: 'Write Data',
                value: frame.decToBaseN(frame.context.writeData),
            },
            {
                label: 'RegWrite',
                value: String(frame.signals.RegWrite),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'ID'
                        ? 'Outputs register values for the current instruction.'
                        : frame.step === 'WB'
                          ? 'May write data into the selected destination register.'
                          : 'Keeps register values available.',
            },
        ],
    };
}

function getALUInspectInfo(frame: InspectInfoFrame): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'Arithmetic Logic Unit (ALU)',
        subtitle:
            'Computes arithmetic or logic results from two input operands.',
        rows: [
            {
                label: 'Input 1',
                value: frame.decToBaseN(frame.context.aluOp1),
            },
            {
                label: 'Input 2',
                value: frame.decToBaseN(frame.context.aluOp2),
            },
            {
                label: 'ALUOp',
                value: frame.signals.ALUOp,
            },
            {
                label: 'Operation',
                value: frame.context.aluOp ?? 'UNDEFINED',
            },
            {
                label: 'Result',
                value: frame.decToBaseN(frame.context.aluResult),
            },
            {
                label: 'Zero flag',
                value: frame.context.isZero ? 'TRUE' : 'FALSE',
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'EX'
                        ? 'Executes the selected ALU operation.'
                        : 'Keeps the last computed ALU outputs available.',
            },
        ],
    };
}

function getDataMemoryInspectInfo(
    frame: InspectInfoFrame,
): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'Data Memory',
        subtitle:
            'Reads from or writes to memory using the ALU result as address.',
        rows: [
            {
                label: 'Address',
                value: frame.decToBaseN(frame.context.memAddress),
            },
            {
                label: 'Write Data',
                value: frame.decToBaseN(frame.context.memWriteData),
            },
            {
                label: 'Read Data',
                value: frame.decToBaseN(frame.context.memReadData),
            },
            {
                label: 'MemRead',
                value: String(frame.signals.MemRead),
            },
            {
                label: 'MemWrite',
                value: String(frame.signals.MemWrite),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'MEM'
                        ? 'Performs memory read/write if enabled by control signals.'
                        : 'Keeps memory contents unchanged.',
            },
        ],
    };
}

function formatMuxChoice(
    signal: 0 | 1 | 'X' | undefined,
    zeroChoice: string,
    oneChoice: string,
): string {
    if (signal === 0) {
        return zeroChoice;
    }
    if (signal === 1) {
        return oneChoice;
    }
    return 'UNDEFINED';
}

function getALUSrcMUXInspectInfo(frame: InspectInfoFrame): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'ALUSrc MUX',
        subtitle: 'Selects the second input to the ALU.',
        rows: [
            {
                label: 'Control',
                value: `ALUSrc = ${String(frame.signals.ALUSrc)}`,
            },
            {
                label: 'Input 0 (RD2)',
                value: `${frame.decToBaseN(frame.context.readData2)}`,
            },
            {
                label: 'Input 1 (Immediate)',
                value: `${frame.decToBaseN(frame.context.immediate)}`,
            },
            {
                label: 'Selected',
                value: formatMuxChoice(
                    frame.signals.ALUSrc,
                    'Input 0: Register data',
                    'Input 1: Sign-extended immediate',
                ),
            },
            {
                label: 'Output',
                value: frame.decToBaseN(frame.context.aluOp2),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'EX'
                        ? 'Selects ALU operand 2 for execution.'
                        : 'Keeps the selected ALU input path available.',
            },
        ],
    };
}

function getRegDstMUXInspectInfo(frame: InspectInfoFrame): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'RegDst MUX',
        subtitle:
            'Selects which instruction field becomes the register-file write address.',
        rows: [
            {
                label: 'Control',
                value: `RegDst = ${String(frame.signals.RegDst)}`,
            },
            {
                label: 'Input 0 (rt)',
                value: `${formatRegister(frame.context.readReg2)}`,
            },
            {
                label: 'Input 1 (rd)',
                value: `${formatRegister(frame.context.instruction?.rd)}`,
            },
            {
                label: 'Selected',
                value: formatMuxChoice(
                    frame.signals.RegDst,
                    'Input 0: rt',
                    'Input 1: rd',
                ),
            },
            {
                label: 'Output',
                value: formatRegister(frame.context.writeReg),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'ID'
                        ? 'Chooses the potential destination register.'
                        : frame.step === 'WB'
                          ? 'Provides the register-file write address.'
                          : 'Keeps the selected write-register field available.',
            },
        ],
    };
}

function getMemToRegMUXInspectInfo(
    frame: InspectInfoFrame,
): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'MemToReg MUX',
        subtitle: 'Selects the data written back to the register file.',
        rows: [
            {
                label: 'Control',
                value: `MemToReg = ${String(frame.signals.MemToReg)}`,
            },
            {
                label: 'Input 0 (ALU result)',
                value: `${frame.decToBaseN(frame.context.aluResult)}`,
            },
            {
                label: 'Input 1 (Memory read data)',
                value: `${frame.decToBaseN(frame.context.memReadData)}`,
            },
            {
                label: 'Selected',
                value: formatMuxChoice(
                    frame.signals.MemToReg,
                    'Input 0: ALU result',
                    'Input 1: Memory read data',
                ),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'WB'
                        ? 'Chooses the value sent to register-file write data.'
                        : 'Keeps the selected write-back data path available.',
            },
        ],
    };
}

function getPCSrcMUXInspectInfo(frame: InspectInfoFrame): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'PCSrc MUX',
        subtitle: 'Selects the next value written into the PC.',
        rows: [
            {
                label: 'Control',
                value: `PCSrc = ${String(frame.signals.PCSrc ?? 'X')}`,
            },
            {
                label: 'Input 0 (PC + 4)',
                value: `${frame.decToBaseN(frame.context.pcPlus4)}`,
            },
            {
                label: 'Input 1 (Branch target)',
                value: `${frame.decToBaseN(frame.context.branchTarget)}`,
            },
            {
                label: 'Selected',
                value: formatMuxChoice(
                    frame.signals.PCSrc,
                    'Input 0: PC + 4',
                    'Input 1: Branch target',
                ),
            },
            {
                label: 'Output',
                value: frame.decToBaseN(frame.context.nextPc),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'MEM'
                        ? 'Chooses the next PC after branch decision.'
                        : 'Keeps the selected next-PC path available.',
            },
        ],
    };
}

function getSignExtendInspectInfo(
    frame: InspectInfoFrame,
): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'Sign Extend',
        subtitle:
            'Extends the 16-bit immediate field into a 32-bit signed value.',
        rows: [
            {
                label: 'Input immediate',
                value: formatSignedField(
                    frame.context.instruction?.immediate,
                    16,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'Output',
                value: formatSignedField(
                    frame.context.immediate,
                    32,
                    frame.instructionDisplayFormat,
                ),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'ID'
                        ? 'Extends the immediate field from the instruction register.'
                        : frame.step === 'EX'
                          ? 'Provides the immediate value to ALUSrc MUX or branch target logic.'
                          : 'Keeps the sign-extended immediate available.',
            },
        ],
    };
}

function getLeftShift2InspectInfo(
    frame: InspectInfoFrame,
): DatapathInspectInfo {
    const shifted =
        frame.context.immediate === undefined
            ? undefined
            : frame.context.immediate << 2;

    return {
        id: frame.id,
        title: 'Left Shift 2',
        subtitle:
            'Shifts the sign-extended immediate left by 2 bits for branch target calculation.',
        rows: [
            {
                label: 'Input (Sign-extended immediate)',
                value: frame.decToBaseN(frame.context.immediate),
            },
            {
                label: 'Output',
                value: frame.decToBaseN(shifted),
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'EX'
                        ? 'Produces the branch offset used by the branch adder.'
                        : 'Keeps the shifted branch offset available.',
            },
        ],
    };
}

function getAdd4InspectInfo(frame: InspectInfoFrame): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'PC + 4 Adder',
        subtitle:
            'Adds 4 to the current PC to get the address of the next sequential instruction.',
        rows: [
            {
                label: 'Input 0 (PC)',
                value: `${frame.decToBaseN(frame.machine.pc)}`,
            },
            {
                label: 'Input 1 (Constant 4)',
                value: `${frame.decToBaseN(4)}`,
            },
            {
                label: 'Output',
                value: `${frame.decToBaseN(frame.context.pcPlus4)}`,
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'IF'
                        ? 'Computes the next sequential PC value.'
                        : 'Keeps PC + 4 available for PCSrc MUX and branch target calculation.',
            },
        ],
    };
}

function getBranchAdderInspectInfo(
    frame: InspectInfoFrame,
): DatapathInspectInfo {
    return {
        id: frame.id,
        title: 'Branch Adder',
        subtitle:
            'Adds PC + 4 to the shifted branch offset to compute the branch target address.',
        rows: [
            {
                label: 'Input 0 (PC + 4)',
                value: `${frame.decToBaseN(frame.context.pcPlus4)}`,
            },
            {
                label: 'Input 1 (Shifted immediate)',
                value: `${frame.decToBaseN(
                    frame.context.immediate === undefined
                        ? undefined
                        : frame.context.immediate << 2,
                )}`,
            },
            {
                label: 'Output',
                value: `${frame.decToBaseN(frame.context.branchTarget)}`,
            },
            {
                label: 'Current role',
                value:
                    frame.step === 'EX'
                        ? 'Computes the target address for branch instructions.'
                        : 'Keeps the branch target available for the PCSrc MUX.',
            },
        ],
    };
}

export function getDatapathInspectInfo(
    id: DatapathInspectID | null,
    step: DatapathStep | null,
    machine: MachineState,
    context: ExecutionContext,
    signals: RuntimeControlSignals,
    instructionDisplayFormat: InstructionDisplayFormat = 'hex',
): DatapathInspectInfo | null {
    if (id === null) {
        return null;
    }

    const frame: InspectInfoFrame = {
        id,
        step,
        machine,
        context,
        signals,
        instructionDisplayFormat,
        decToBaseN: (num: number | undefined, bits: number = 32) => {
            if (num === undefined) {
                return 'UNDEFINED';
            }
            const value = encodeField(num, bits);
            return getRepresentation(value, instructionDisplayFormat);
        },
    };

    if (id === 'PC') {
        return getPCInspectInfo(frame);
    }

    if (id === 'INSTRUCTION_MEMORY') {
        return getInstructionMemoryInspectInfo(frame);
    }

    if (id === 'INSTRUCTION_REGISTER') {
        return getInstructionRegisterInspectInfo(frame);
    }

    if (id === 'REGISTER_FILE') {
        return getRegisterFileInspectInfo(frame);
    }

    if (id === 'REGDST_MUX') {
        return getRegDstMUXInspectInfo(frame);
    }

    if (id === 'ALUSRC_MUX') {
        return getALUSrcMUXInspectInfo(frame);
    }

    if (id === 'MEMTOREG_MUX') {
        return getMemToRegMUXInspectInfo(frame);
    }

    if (id === 'PCSRC_MUX') {
        return getPCSrcMUXInspectInfo(frame);
    }

    if (id === 'SIGN_EXTEND') {
        return getSignExtendInspectInfo(frame);
    }

    if (id === 'LEFT_SHIFT_2') {
        return getLeftShift2InspectInfo(frame);
    }

    if (id === 'ADD4') {
        return getAdd4InspectInfo(frame);
    }

    if (id === 'BRANCH_ADDER') {
        return getBranchAdderInspectInfo(frame);
    }

    if (id === 'ALU') {
        return getALUInspectInfo(frame);
    }

    if (id === 'DATA_MEMORY') {
        return getDataMemoryInspectInfo(frame);
    }

    return {
        id,
        title: 'Unknown Component',
        subtitle: 'No information available for this component.',
        rows: [],
    };
}
