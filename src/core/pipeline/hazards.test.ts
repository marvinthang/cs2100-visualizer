import { describe, expect, it } from 'vitest';
import { parseMipsProgram } from '../mips/assembly/parseMipsProgram';
import { buildHazardSchedule } from './hazards';

function schedule(source: string, forwarding: boolean) {
    const { instructions } = parseMipsProgram(source);
    return buildHazardSchedule(instructions, { forwarding });
}

// lecture exercise 1: a chain of instructions all using $2
const EX1 = [
    'sub $2, $1, $3',
    'and $12, $2, $5',
    'or  $13, $6, $2',
    'add $14, $2, $2',
    'sw  $15, 100($2)',
].join('\n');

// lecture exercise 2: same chain but starting with a load
const EX2 = [
    'lw  $2, 20($3)',
    'and $12, $2, $5',
    'or  $13, $6, $2',
    'add $14, $2, $2',
    'sw  $15, 100($2)',
].join('\n');

describe('exercise #1 (ALU chain)', () => {
    it('takes 11 cycles without forwarding (2 stalls)', () => {
        const result = schedule(EX1, false);
        expect(result.totalCycles).toBe(11);
        expect(result.totalStalls).toBe(2);
    });

    it('takes 9 cycles with forwarding (0 stalls)', () => {
        const result = schedule(EX1, true);
        expect(result.totalCycles).toBe(9);
        expect(result.totalStalls).toBe(0);
    });
});

describe('exercise #2 (load-use chain)', () => {
    it('takes 11 cycles without forwarding (2 stalls)', () => {
        const result = schedule(EX2, false);
        expect(result.totalCycles).toBe(11);
        expect(result.totalStalls).toBe(2);
    });

    it('still needs 1 bubble with forwarding (load-use), 10 cycles', () => {
        const result = schedule(EX2, true);
        expect(result.totalCycles).toBe(10);
        expect(result.totalStalls).toBe(1);
    });
});

describe('no false hazards', () => {
    it('ignores $zero dependencies', () => {
        const result = schedule('add $0, $1, $2\nor $3, $0, $4', true);
        expect(result.totalStalls).toBe(0);
    });

    it('does not stall independent instructions', () => {
        const result = schedule('add $1, $2, $3\nsub $4, $5, $6', true);
        expect(result.totalStalls).toBe(0);
    });
});
