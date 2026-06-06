import { describe, expect, it } from 'vitest';
import { assembleMipsProgram } from './assembleMipsProgram';
import { parseMipsProgram } from './parseMipsProgram';

describe('parseMipsProgram', () => {
    it('parses add $t0, $t1, $t2 into decoded fields', () => {
        const result = parseMipsProgram('add $t0, $t1, $t2');

        expect(result.errors).toEqual([]);
        expect(result.instructions[0]).toMatchObject({
            line: 1,
            text: 'add $t0, $t1, $t2',
            fields: {
                mnemonic: 'add',
                rs: 9,
                rt: 10,
                rd: 8,
                immediate: 0,
                funct: 0x20,
            },
        });
    });

    it('parses addi $t0, $t1, 4 into decoded fields', () => {
        const result = parseMipsProgram('addi $t0, $t1, 4');

        expect(result.errors).toEqual([]);
        expect(result.instructions[0].fields).toMatchObject({
            mnemonic: 'addi',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: 4,
        });
    });

    it('parses lw $t0, 4($t1) with base register and offset', () => {
        const result = parseMipsProgram('lw $t0, 4($t1)');

        expect(result.errors).toEqual([]);
        expect(result.instructions[0].fields).toMatchObject({
            mnemonic: 'lw',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: 4,
        });
    });

    it('parses sw $t0, 4($t1) with base register and offset', () => {
        const result = parseMipsProgram('sw $t0, 4($t1)');

        expect(result.errors).toEqual([]);
        expect(result.instructions[0].fields).toMatchObject({
            mnemonic: 'sw',
            rs: 9,
            rt: 8,
            rd: 0,
            immediate: 4,
        });
    });
});

describe('assembleMipsProgram', () => {
    it('resolves a beq label to the relative branch offset', () => {
        const result = assembleMipsProgram(`
beq $t0, $t1, target
addi $t2, $zero, 1
target:
add $t3, $t0, $t1
`);

        expect(result.errors).toEqual([]);
        expect(result.instructions[0].fields).toMatchObject({
            mnemonic: 'beq',
            rs: 8,
            rt: 9,
            immediate: 1,
        });
        expect(result.instructions[0].word).toBe(0x11090001);
    });

    it('resolves a j label to the absolute instruction target', () => {
        const result = assembleMipsProgram(`
j target
addi $t0, $zero, 1
target:
add $t1, $t0, $zero
`);

        expect(result.errors).toEqual([]);
        expect(result.instructions[0].fields).toMatchObject({
            mnemonic: 'j',
            address: 2,
        });
        expect(result.instructions[0].word).toBe(0x08000002);
    });

    it('reports unsupported instructions without producing invalid output', () => {
        const result = assembleMipsProgram('mul $t0, $t1, $t2');

        expect(result.instructions).toEqual([]);
        expect(result.errors).toEqual([
            { line: 1, message: 'unknown instruction: mul' },
        ]);
    });
});
