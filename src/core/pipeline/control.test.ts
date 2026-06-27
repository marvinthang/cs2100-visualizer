import { describe, expect, it } from 'vitest';
import { buildHazardSchedule } from './hazards';
import { buildExecutionTrace } from './trace';

function schedule(
    source: string,
    options: Parameters<typeof buildHazardSchedule>[1],
) {
    return buildHazardSchedule(buildExecutionTrace(source).steps, options);
}

// lecture exercise 3: a loop that runs 10 times
const EX3 = [
    'addi $s0, $zero, 10',
    'Loop: addi $s0, $s0, -1',
    'bne $s0, $zero, Loop',
    'sub $t0, $t1, $t2',
].join('\n');

describe('execution trace', () => {
    it('unrolls the loop into 22 executed instructions', () => {
        const trace = buildExecutionTrace(EX3);
        expect(trace.steps).toHaveLength(22);
        expect(trace.truncated).toBe(false);
    });

    it('records 9 taken branches and 1 not-taken', () => {
        const branches = buildExecutionTrace(EX3).steps.filter(
            (s) => s.fields.mnemonic === 'bne',
        );
        expect(branches.filter((b) => b.taken)).toHaveLength(9);
        expect(branches.filter((b) => !b.taken)).toHaveLength(1);
    });
});

describe('exercise #3 (loop, forwarding + early branch)', () => {
    const base = { forwarding: true, earlyBranch: true, delaySlot: false };

    it('takes 46 cycles with stalling (no prediction)', () => {
        expect(schedule(EX3, { ...base, prediction: false }).totalCycles).toBe(
            46,
        );
    });

    it('takes 45 cycles with predict-not-taken', () => {
        expect(schedule(EX3, { ...base, prediction: true }).totalCycles).toBe(
            45,
        );
    });

    // the loop branch is taken 9/10 times, so guessing taken is better
    it('takes 37 cycles with predict-taken', () => {
        expect(
            schedule(EX3, { ...base, prediction: true, predictTaken: true })
                .totalCycles,
        ).toBe(37);
    });
});

describe('jump (j) penalty', () => {
    const prog = 'j Skip\nadd $1, $2, $3\nSkip: add $4, $5, $6';

    it('always costs 1 flush, independent of early-branch setting', () => {
        const early = schedule(prog, {
            forwarding: true,
            earlyBranch: true,
            prediction: false,
        });
        const late = schedule(prog, {
            forwarding: true,
            earlyBranch: false, // beq would be 3 here; j must stay 1
            prediction: false,
        });
        expect(early.totalFlushes).toBe(1);
        expect(late.totalFlushes).toBe(1);
        expect(early.totalCycles).toBe(late.totalCycles);
    });

    it('costs 3 flushes when resolved in MEM (jumpInId off)', () => {
        const result = schedule(prog, {
            forwarding: true,
            earlyBranch: true,
            prediction: false,
            jumpInId: false,
        });
        expect(result.totalFlushes).toBe(3);
    });
});

describe('single taken branch penalty', () => {
    const prog = 'beq $0, $0, T\nadd $1, $2, $3\nT: or $4, $5, $6';

    it('flushes 3 on a late (MEM) branch', () => {
        const result = schedule(prog, {
            forwarding: true,
            earlyBranch: false,
            prediction: false,
        });
        expect(result.totalFlushes).toBe(3);
    });

    it('flushes 1 on an early (ID) branch', () => {
        const result = schedule(prog, {
            forwarding: true,
            earlyBranch: true,
            prediction: false,
        });
        expect(result.totalFlushes).toBe(1);
    });
});
