import { describe, expect, it } from 'vitest';
import type { MipsInstructionFields } from '../../../types/mips';
import {
    encodeMipsInstruction,
    encodeMipsInstructionWord,
} from './encodeMipsInstruction';

describe('MIPS instruction encoding', () => {
    it('encodes add $t0, $t1, $t2 as an R-type word', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'add',
            rs: 9,
            rt: 10,
            rd: 8,
            immediate: 0,
            funct: 0x20,
        };

        const encoded = encodeMipsInstruction(instruction);

        expect(encodeMipsInstructionWord(instruction)).toBe(0x012a4020);
        expect(encoded.full.hex).toBe('0x012A4020');
        expect(encoded.full.bin).toBe(
            '00000001001010100100000000100000',
        );
        expect(encoded.rs.dec).toBe('9');
        expect(encoded.rt.dec).toBe('10');
        expect(encoded.rd.dec).toBe('8');
        expect(encoded.funct.hex).toBe('0x20');
    });

    it('encodes addi $t0, $t1, 4 as an I-type word', () => {
        const instruction: MipsInstructionFields = {
            mnemonic: 'addi',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: 4,
        };

        const encoded = encodeMipsInstruction(instruction);

        expect(encodeMipsInstructionWord(instruction)).toBe(0x21280004);
        expect(encoded.full.hex).toBe('0x21280004');
        expect(encoded.opcode.hex).toBe('0x08');
        expect(encoded.rs.dec).toBe('9');
        expect(encoded.rt.dec).toBe('8');
        expect(encoded.immediate.hex).toBe('0x0004');
    });
});
