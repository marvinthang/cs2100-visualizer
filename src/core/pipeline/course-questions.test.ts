import { describe, expect, it } from 'vitest';
import { createInitialMachineState } from '../mips/single-cycle/execution/machineState';
import { buildHazardSchedule, type HazardOptions } from './hazards';
import { buildExecutionTrace } from './trace';

// Check the cycle counts against past tutorial/exam pipelining questions.
// We add a few setup lines so the branches go the way the question says, then
// measure from the first instruction's IF to the last instruction's WB.
function span(
    setup: string[],
    body: string[],
    count: number,
    options: HazardOptions,
): number {
    const trace = buildExecutionTrace([...setup, ...body].join('\n'), 200);
    const schedule = buildHazardSchedule(trace.steps, options);
    const first = schedule.instructions[setup.length].startCycle;
    const last = schedule.instructions[setup.length + count - 1].startCycle;
    return last - first + 5; // IF of first .. WB of last
}

// past exam (tut Q1): branches depend on $s0 / $s1 set before the run.
// Counts the first iteration A..H (until the srl finishes WB).
describe('exam 14s2 — data-dependent loop, first iteration', () => {
    const init = createInitialMachineState();
    (init.registers as Record<number, number>)[16] = 0xafaffafa; // $s0
    (init.registers as Record<number, number>)[17] = 0xff; // $s1
    const prog = [
        'add $t0, $s0, $zero',
        'add $s2, $zero, $zero',
        'lp: bne $s2, $zero, done',
        'beq $t0, $zero, done',
        'andi $t1, $t0, 0xFF',
        'bne $s1, $t1, nt',
        'addi $s2, $s2, 1',
        'nt: srl $t0, $t0, 8',
        'j lp',
        'done: add $zero, $zero, $zero',
    ].join('\n');
    const firstIter = (options: HazardOptions) => {
        const trace = buildExecutionTrace(prog, 300, init);
        const schedule = buildHazardSchedule(trace.steps, options);
        const h = schedule.instructions.findIndex((i) =>
            i.text.includes('srl'),
        );
        return (
            schedule.instructions[h].startCycle -
            schedule.instructions[0].startCycle +
            5
        );
    };

    it('(a) forwarding, MEM-stall branches = 20 cycles', () => {
        expect(
            firstIter({
                forwarding: true,
                earlyBranch: false,
                prediction: false,
            }),
        ).toBe(20);
    });
    it('(b) forwarding, predict-not-taken = 14 cycles', () => {
        expect(
            firstIter({
                forwarding: true,
                earlyBranch: false,
                prediction: true,
            }),
        ).toBe(14);
    });
});

// tutorial Q3: loop where all array values are odd, so both branches fall through
describe('exam 20s2 — array loop, first iteration', () => {
    const setup = [
        'addi $s2, $zero, 8',
        'addi $t6, $zero, 11',
        'sw $t6, 0($zero)',
    ];
    const body = [
        'add $s5, $0, $0',
        'add $t0, $0, $0',
        'loop: slt $t8, $t0, $s2',
        'beq $t8, $0, end',
        'sll $t1, $t0, 2',
        'add $t3, $t1, $s0',
        'lw $s3, 0($t3)',
        'andi $t9, $s3, 1',
        'beq $t9, $0, skip',
        'add $t4, $t1, $s1',
        'lw $s4, 0($t4)',
        'sub $s3, $s3, $s4',
        'sw $s3, 0($t3)',
        'addi $s5, $s5, 1',
        'skip: addi $t0, $t0, 1',
        'j loop',
        'end: add $zero, $zero, $zero',
    ];
    const cycles = (o: HazardOptions) => span(setup, body, 16, o);

    it('(b) no forwarding, MEM branch = +24 (44)', () => {
        expect(
            cycles({ forwarding: false, earlyBranch: false, prediction: false }),
        ).toBe(44);
    });
    it('(c) no forwarding, ID branch = +20 (40)', () => {
        expect(
            cycles({ forwarding: false, earlyBranch: true, prediction: false }),
        ).toBe(40);
    });
    it('(d) forwarding, ID branch, predict-not-taken = +4 (24)', () => {
        expect(
            cycles({ forwarding: true, earlyBranch: true, prediction: true }),
        ).toBe(24);
    });
});

// tutorial Q2: which path runs depends on B[i] % 4
describe('exam 17s2 — branch-path loop, forwarding + early branch', () => {
    const body = [
        'beq $s2, $zero, End',
        'addi $t8, $s2, -1',
        'sll $t8, $t8, 2',
        'Loop: add $t0, $s0, $t8',
        'add $t1, $s1, $t8',
        'lw $t2, 0($t0)',
        'lw $t3, 0($t1)',
        'andi $t4, $t3, 3',
        'addi $t4, $t4, -3',
        'beq $t4, $zero, A1',
        'add $t2, $t2, $t3',
        'j A2',
        'A1: addi $t2, $t2, 1',
        'A2: sw $t2, 0($t0)',
        'addi $t8, $t8, -8',
        'slt $t7, $t8, $zero',
        'beq $t7, $zero, Loop',
        'End: add $zero, $zero, $zero',
    ];
    const opts: HazardOptions = {
        forwarding: true,
        earlyBranch: true,
        prediction: false,
        jumpInId: true,
    };
    // Count I1..I17; the iteration ends at the trailing beq $t7.
    const lastBeqSpan = (mem0: number) => {
        const setup = [
            'addi $s2, $zero, 1',
            `addi $t6, $zero, ${mem0}`,
            'sw $t6, 0($zero)',
        ];
        const trace = buildExecutionTrace(
            [...setup, ...body].join('\n'),
            200,
        );
        const schedule = buildHazardSchedule(trace.steps, opts);
        const first = schedule.instructions[setup.length].startCycle;
        let lastIdx = schedule.instructions.length - 1;
        for (let i = lastIdx; i >= 0; i--) {
            if (schedule.instructions[i].text.includes('beq $t7')) {
                lastIdx = i;
                break;
            }
        }
        return schedule.instructions[lastIdx].startCycle - first + 5;
    };

    it('(c) I10 branch taken = 24 cycles', () => {
        expect(lastBeqSpan(7)).toBe(24); // 7 % 4 == 3 -> taken
    });
    it('(d) I10 branch not taken = 26 cycles', () => {
        expect(lastBeqSpan(9)).toBe(26); // 9 % 4 != 3 -> not taken
    });
});

// past exam: count Inst1..Inst19 (skip the jump), until Inst19 finishes
describe('exam 18s2 — array-add loop', () => {
    const setup = ['addi $s3, $zero, 4'];
    const body = [
        'add $t0, $s0, $0',
        'add $t1, $s1, $0',
        'add $t2, $s2, $0',
        'add $t3, $s3, $s3',
        'add $t4, $0, $0',
        'Loop: slt $t5, $t4, $t3',
        'beq $t5, $0, End',
        'lw $t6, 0($t0)',
        'lw $t7, 0($t1)',
        'add $t6, $t6, $t7',
        'sw $t6, 0($t0)',
        'lw $t8, 4($t0)',
        'lw $t9, 0($t2)',
        'add $t8, $t8, $t9',
        'sw $t8, 4($t0)',
        'addi $t0, $t0, 8',
        'addi $t1, $t1, 4',
        'addi $t2, $t2, 4',
        'addi $t4, $t4, 2',
        'j Loop',
        'End: add $zero, $zero, $zero',
    ];
    const cycles = (o: HazardOptions) => span(setup, body, 19, o);

    it('(b) no forwarding, MEM branch = 38 cycles', () => {
        expect(
            cycles({ forwarding: false, earlyBranch: false, prediction: false }),
        ).toBe(38);
    });
    it('(c) forwarding, early branch = 27 cycles', () => {
        expect(
            cycles({ forwarding: true, earlyBranch: true, prediction: false }),
        ).toBe(27);
    });
    it('(d) forwarding, early branch, predict-not-taken = 26 cycles', () => {
        expect(
            cycles({ forwarding: true, earlyBranch: true, prediction: true }),
        ).toBe(26);
    });
});

// past exam: image-merge loop, Inst1..Inst23, until Inst23 finishes
// xor isn't supported, use and (same registers, same timing)
describe('exam 19s2 — image-merge loop', () => {
    const setup = ['addi $s0, $zero, 1024'];
    const body = [
        'add $t1, $0, $0',
        'add $t2, $0, $0',
        'add $t3, $0, $0',
        'L1: slt $t0, $t1, $s0',
        'beq $t0, $0, E1',
        'L2: slt $t0, $t2, $s0',
        'beq $t0, $0, E2',
        'add $t4, $s1, $t3',
        'lw $t5, 0($t4)',
        'add $t6, $s2, $t3',
        'lw $t7, 0($t6)',
        'and $t9, $t5, $t7',
        'andi $t5, $t5, 255',
        'andi $t7, $t7, 255',
        'add $t0, $t5, $t7',
        'srl $t0, $t0, 1',
        'srl $t9, $t9, 8',
        'sll $t9, $t9, 8',
        'or $t9, $t9, $t0',
        'add $t8, $s3, $t3',
        'sw $t9, 0($t8)',
        'addi $t3, $t3, 4',
        'addi $t2, $t2, 1',
        'j L2',
        'E2: add $0, $0, $0',
        'E1: add $0, $0, $0',
    ];
    const cycles = (o: HazardOptions) => span(setup, body, 23, o);

    it('(b) no forwarding, MEM branch = 53 (+26)', () => {
        expect(
            cycles({ forwarding: false, earlyBranch: false, prediction: false }),
        ).toBe(53);
    });
    it('(c) no forwarding, ID branch = 49 (+22)', () => {
        expect(
            cycles({ forwarding: false, earlyBranch: true, prediction: false }),
        ).toBe(49);
    });
    it('(d) forwarding, ID branch, predict-not-taken = 30 (+3)', () => {
        expect(
            cycles({ forwarding: true, earlyBranch: true, prediction: true }),
        ).toBe(30);
    });
});

// past exam (24s2): array loop, A[0]=23 so the bne is taken (skips two
// instructions). Counts the first iteration Inst1..Inst15 until the j finishes.
describe('exam 24s2 — array loop with data, first iteration', () => {
    const init = createInitialMachineState();
    const regs = init.registers as Record<number, number>;
    regs[4] = 9; // $a0 = size
    regs[5] = 0; // $a1 = base of A
    regs[6] = 64; // $a2 = base of B
    const mem = init.dataMemory as Record<number, number>;
    [23, 13, 16, 20, 100, 17, 82, 12, 80].forEach((v, i) => {
        mem[i * 4] = v;
    });
    [11, 22, 33, 44, 55, 66, 77, 88, 99].forEach((v, i) => {
        mem[64 + i * 4] = v;
    });
    const prog = [
        'add $t0, $0, $0',
        'addi $t1, $a1, 0',
        'addi $t2, $a2, 0',
        'loop: slt $t9, $t0, $a0',
        'beq $t9, $0, exit',
        'lw $s1, 0($t1)',
        'lw $s2, 0($t2)',
        'andi $s3, $s1, 3',
        'bne $s3, $0, skip',
        'addi $s2, $s2, -1',
        'sw $s2, 0($t2)',
        'skip: addi $t0, $t0, 2',
        'addi $t1, $t1, 8',
        'addi $t2, $t2, 8',
        'j loop',
        'exit: add $zero, $zero, $zero',
    ].join('\n');
    const firstIter = (options: HazardOptions) => {
        const trace = buildExecutionTrace(prog, 300, init);
        const schedule = buildHazardSchedule(trace.steps, options);
        const j = schedule.instructions.findIndex((i) =>
            i.text.trim().startsWith('j '),
        );
        return (
            schedule.instructions[j].startCycle -
            schedule.instructions[0].startCycle +
            5
        );
    };

    it('(b) no forwarding, MEM branch = 28 (+11)', () => {
        expect(
            firstIter({
                forwarding: false,
                earlyBranch: false,
                prediction: false,
                jumpInId: true,
            }),
        ).toBe(28);
    });
    it('(c) forwarding, MEM branch = 23 (+6)', () => {
        expect(
            firstIter({
                forwarding: true,
                earlyBranch: false,
                prediction: false,
                jumpInId: true,
            }),
        ).toBe(23);
    });
    it('(d) forwarding, ID branch, predict-not-taken = 20 (+3)', () => {
        expect(
            firstIter({
                forwarding: true,
                earlyBranch: true,
                prediction: true,
                jumpInId: true,
            }),
        ).toBe(20);
    });
});

// past exam (23s2): array loop, first iteration runs the whole i1..i20 body.
describe('exam 23s2 — array loop, first iteration', () => {
    const init = createInitialMachineState();
    const regs = init.registers as Record<number, number>;
    regs[16] = 8; // $s0 = n
    regs[17] = 0; // $s1 base of A
    regs[18] = 256; // $s2 base of B
    regs[19] = 512; // $s3 base of C
    const prog = [
        'addi $a1, $s1, 0',
        'addi $a2, $s2, 0',
        'addi $a3, $s3, 0',
        'addi $t0, $0, 0',
        'addi $s4, $0, 0',
        'loop: slt $t1, $t0, $s0',
        'beq $t1, $0, exit',
        'andi $t1, $t0, 3',
        'srl $t1, $t1, 1',
        'bne $t1, $0, skip',
        'lw $t1, 0($a1)',
        'lw $t2, 0($a2)',
        'add $t3, $t1, $t2',
        'sw $t3, 0($a3)',
        'addi $a3, $a3, 4',
        'addi $s4, $s4, 1',
        'skip: addi $a1, $a1, 4',
        'addi $a2, $a2, 4',
        'addi $t0, $t0, 1',
        'j loop',
        'exit: add $zero, $zero, $zero',
    ].join('\n');
    const firstIter = (options: HazardOptions) => {
        const trace = buildExecutionTrace(prog, 300, init);
        const schedule = buildHazardSchedule(trace.steps, options);
        const j = schedule.instructions.findIndex((i) =>
            i.text.trim().startsWith('j '),
        );
        return (
            schedule.instructions[j].startCycle -
            schedule.instructions[0].startCycle +
            5
        );
    };

    it('(b) no forwarding, MEM branch = 41 (+17)', () => {
        expect(
            firstIter({
                forwarding: false,
                earlyBranch: false,
                prediction: false,
                jumpInId: true,
            }),
        ).toBe(41);
    });
    it('(c) forwarding, MEM branch = 31 (+7)', () => {
        expect(
            firstIter({
                forwarding: true,
                earlyBranch: false,
                prediction: false,
                jumpInId: true,
            }),
        ).toBe(31);
    });
    it('(d) forwarding, ID branch, predict-not-taken = 27 (+3)', () => {
        expect(
            firstIter({
                forwarding: true,
                earlyBranch: true,
                prediction: true,
                jumpInId: true,
            }),
        ).toBe(27);
    });
});

// past exam (24s1 Q19): straight-line program, no branches or input data.
describe('exam 24s1 — straight-line load-use chain', () => {
    const body = [
        'lw $s1, 20($s2)',
        'lw $s2, 40($s5)',
        'add $s5, $s2, $s1',
        'addi $s5, $s1, 0x23',
        'sub $t1, $s5, $t2',
        'sw $s5, 50($s2)',
        'add $t5, $a0, $zero',
    ];
    const run = (options: HazardOptions) =>
        buildHazardSchedule(buildExecutionTrace(body.join('\n')).steps, options);

    it('(a) without forwarding = 4 stall cycles', () => {
        expect(
            run({ forwarding: false, earlyBranch: false, prediction: false })
                .totalStalls,
        ).toBe(4);
    });
    it('(b) without forwarding = 15 cycles', () => {
        expect(
            run({ forwarding: false, earlyBranch: false, prediction: false })
                .totalCycles,
        ).toBe(15);
    });
    it('(c) with forwarding = 12 cycles', () => {
        expect(
            run({ forwarding: true, earlyBranch: false, prediction: false })
                .totalCycles,
        ).toBe(12);
    });
});

// past exam (25s2): array loop, A[0]-B[0] > 0 so Inst16 is skipped (22 instrs).
// Counts the first iteration Inst1..Inst23 until the j finishes.
describe('exam 25s2 — array loop with data, first iteration', () => {
    const init = createInitialMachineState();
    const regs = init.registers as Record<number, number>;
    regs[4] = 4; // $a0 = size
    regs[5] = 0; // $a1 = base of A
    regs[6] = 64; // $a2 = base of B
    const mem = init.dataMemory as Record<number, number>;
    [9, -5, 17, 12].forEach((v, i) => {
        mem[i * 4] = v >>> 0;
    });
    [1, 4, -6, 5].forEach((v, i) => {
        mem[64 + i * 4] = v >>> 0;
    });
    const prog = [
        'add $t0, $0, $0',
        'add $t1, $a1, $0',
        'add $t2, $a2, $0',
        'add $s6, $0, $0',
        'add $s7, $0, $0',
        'loop: slt $t9, $t0, $a0',
        'beq $t9, $0, exit',
        'lw $s1, 0($t1)',
        'lw $s2, 0($t2)',
        'sll $s3, $s2, 2',
        'add $s5, $s1, $s3',
        'add $s6, $s6, $s5',
        'sub $t7, $s1, $s2',
        'slt $t8, $t7, $0',
        'beq $t8, $0, skip1',
        'sub $t7, $0, $t7',
        'skip1: slt $t8, $t7, $s7',
        'bne $t8, $0, skip2',
        'add $s7, $t7, $0',
        'skip2: addi $t0, $t0, 1',
        'addi $t1, $t1, 4',
        'addi $t2, $t2, 4',
        'j loop',
        'exit: add $zero, $zero, $zero',
    ].join('\n');
    const firstIter = (options: HazardOptions) => {
        const trace = buildExecutionTrace(prog, 300, init);
        const schedule = buildHazardSchedule(trace.steps, options);
        const j = schedule.instructions.findIndex((i) =>
            i.text.trim().startsWith('j '),
        );
        return (
            schedule.instructions[j].startCycle -
            schedule.instructions[0].startCycle +
            5
        );
    };

    it('(b) no forwarding, MEM branch = 49 (+23)', () => {
        expect(
            firstIter({
                forwarding: false,
                earlyBranch: false,
                prediction: false,
                jumpInId: true,
            }),
        ).toBe(49);
    });
    it('(c) forwarding, MEM branch = 36 (+10)', () => {
        expect(
            firstIter({
                forwarding: true,
                earlyBranch: false,
                prediction: false,
                jumpInId: true,
            }),
        ).toBe(36);
    });
    it('(d) forwarding, ID branch, predict-not-taken = 31 (+5)', () => {
        expect(
            firstIter({
                forwarding: true,
                earlyBranch: true,
                prediction: true,
                jumpInId: true,
            }),
        ).toBe(31);
    });
});
