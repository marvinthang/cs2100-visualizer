import type { MipsInstructionFields } from '../../../types/mips';
import {
    readRegister,
    readWord,
    writeRegister,
    writeWord,
    type MachineState,
} from '../single-cycle/execution/machineState';

// Execute one full instruction and return the resulting machine state. This is
// a plain instruction-level interpreter (no datapath stages): each instruction
// computes its effect on registers, data memory, and PC directly. Arithmetic is
// kept in 32-bit range with `| 0` (signed) and `>>> 0` where unsigned.
export function executeInstruction(
    machine: MachineState,
    fields: MipsInstructionFields,
): MachineState {
    const pc = machine.pc;
    const rs = readRegister(machine, fields.rs);
    const rt = readRegister(machine, fields.rt);
    const imm = fields.immediate;
    const shamt = fields.shamt ?? 0;

    // Default: advance to the next instruction. Branches and jumps override pc.
    const next: MachineState = { ...machine, pc: pc + 4 };

    switch (fields.mnemonic) {
        case 'add':
            return writeRegister(next, fields.rd, (rs + rt) | 0);
        case 'sub':
            return writeRegister(next, fields.rd, (rs - rt) | 0);
        case 'and':
            return writeRegister(next, fields.rd, rs & rt);
        case 'or':
            return writeRegister(next, fields.rd, rs | rt);
        case 'nor':
            return writeRegister(next, fields.rd, ~(rs | rt));
        case 'slt':
            return writeRegister(next, fields.rd, rs < rt ? 1 : 0);
        case 'sll':
            return writeRegister(next, fields.rd, rt << shamt);
        case 'srl':
            return writeRegister(next, fields.rd, rt >>> shamt);
        case 'addi':
            return writeRegister(next, fields.rt, (rs + imm) | 0);
        case 'andi':
            return writeRegister(next, fields.rt, rs & (imm & 0xffff));
        case 'ori':
            return writeRegister(next, fields.rt, rs | (imm & 0xffff));
        case 'lui':
            return writeRegister(next, fields.rt, (imm & 0xffff) << 16);
        case 'lw':
            return writeRegister(
                next,
                fields.rt,
                readWord(machine, (rs + imm) >>> 0) ?? 0,
            );
        case 'sw':
            return writeWord(next, (rs + imm) >>> 0, rt);
        case 'beq':
            return rs === rt ? { ...next, pc: pc + 4 + (imm << 2) } : next;
        case 'bne':
            return rs !== rt ? { ...next, pc: pc + 4 + (imm << 2) } : next;
        case 'j':
            return { ...next, pc: (fields.address ?? 0) * 4 };
        default:
            return next;
    }
}
