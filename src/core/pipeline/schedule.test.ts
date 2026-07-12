import { describe, expect, it } from 'vitest';
import {
    buildPipelineSchedule,
    parseProgramLines,
    stageAtCycle,
} from './schedule';

describe('parseProgramLines', () => {
    it('drops blank lines and comments', () => {
        const lines = parseProgramLines(
            'sub $2, $1, $3\n\n  and $12, $2, $5  # uses $2\n# whole line\n',
        );
        expect(lines).toEqual(['sub $2, $1, $3', 'and $12, $2, $5']);
    });
});

describe('buildPipelineSchedule', () => {
    it('starts each instruction one cycle after the previous', () => {
        const schedule = buildPipelineSchedule(['a', 'b', 'c']);
        expect(schedule.instructions.map((i) => i.startCycle)).toEqual([
            1, 2, 3,
        ]);
    });

    it('needs N + 4 cycles to drain the pipeline', () => {
        expect(
            buildPipelineSchedule(['a', 'b', 'c', 'd', 'e']).totalCycles,
        ).toBe(9);
    });

    it('has zero cycles for an empty program', () => {
        expect(buildPipelineSchedule([]).totalCycles).toBe(0);
    });
});

describe('stageAtCycle', () => {
    const instruction = { text: 'sub $2, $1, $3', startCycle: 2 };

    it('maps cycles to the staircase of stages', () => {
        expect(stageAtCycle(instruction, 1)).toBeNull();
        expect(stageAtCycle(instruction, 2)).toBe('IF');
        expect(stageAtCycle(instruction, 4)).toBe('EX');
        expect(stageAtCycle(instruction, 6)).toBe('WB');
        expect(stageAtCycle(instruction, 7)).toBeNull();
    });
});
