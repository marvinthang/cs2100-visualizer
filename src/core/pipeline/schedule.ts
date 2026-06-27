// The 5 pipeline stages and where each instruction sits in the diagram.
// This is the simple version with no hazards (every instruction starts one
// cycle after the previous). Stalls/forwarding are added in hazards.ts.

export const PIPELINE_STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface ScheduledInstruction {
    text: string;
    startCycle: number; // cycle of its IF stage (starts at 1)
}

export interface PipelineSchedule {
    instructions: ScheduledInstruction[];
    totalCycles: number;
}

// remove a "# comment" from a line
function stripComment(line: string): string {
    const hash = line.indexOf('#');
    return hash === -1 ? line : line.slice(0, hash);
}

// turn the program text into a list of instruction lines
export function parseProgramLines(source: string): string[] {
    return source
        .split('\n')
        .map((line) => stripComment(line).trim())
        .filter((line) => line.length > 0);
}

// instruction i starts at cycle i+1; need 4 extra cycles for the last to finish
export function buildPipelineSchedule(lines: string[]): PipelineSchedule {
    const instructions = lines.map((text, index) => ({
        text,
        startCycle: index + 1,
    }));
    const totalCycles =
        instructions.length === 0
            ? 0
            : instructions.length + PIPELINE_STAGES.length - 1;
    return { instructions, totalCycles };
}

// which stage an instruction is in at a given cycle (or null if none)
export function stageAtCycle(
    instruction: ScheduledInstruction,
    cycle: number,
): PipelineStage | null {
    const offset = cycle - instruction.startCycle;
    if (offset < 0 || offset >= PIPELINE_STAGES.length) {
        return null;
    }
    return PIPELINE_STAGES[offset];
}
