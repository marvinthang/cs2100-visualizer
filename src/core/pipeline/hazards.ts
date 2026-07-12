// Works out the stalls (bubbles) between instructions in the 5-stage pipeline.

import type { MipsInstructionFields } from '../../types/mips';
import { PIPELINE_STAGES } from './schedule';

export interface RegisterRoles {
    dest: number | null; // register it writes (null if none)
    sources: number[]; // registers it reads (ignoring $zero)
    isLoad: boolean; // true for lw
}

// Hazard cases from the lecture delay table (why.jpeg).
export type StallCase =
    | 'raw'
    | 'load'
    | 'branchMem'
    | 'branchId'
    | 'rawBranchId'
    | 'loadBranchId'
    | 'jump';

export interface HazardScheduledInstruction extends RegisterRoles {
    text: string;
    line: number; // source line this instruction is on
    startCycle: number;
    stallBefore: number; // bubbles before this instruction
    stallReason: string; // why it stalled (empty if it didn't)
    stallCases: StallCase[]; // which delay-table rows apply
}

// one forwarding arrow, from one cell to another
export interface ForwardEdge {
    fromRow: number;
    fromCycle: number;
    toRow: number;
    toCycle: number;
    fromLoad: boolean; // came from a lw
}

export interface HazardSchedule {
    instructions: HazardScheduledInstruction[];
    totalCycles: number;
    totalStalls: number;
    totalFlushes: number;
    forwardEdges: ForwardEdge[];
}

// what the scheduler needs from each instruction
export interface ScheduleItem {
    text: string;
    line?: number; // source line this instruction is on
    fields: MipsInstructionFields;
    isControl?: boolean; // branch or jump
    isJump?: boolean; // the j instruction
    taken?: boolean; // did the branch jump
}

export interface HazardOptions {
    forwarding: boolean;
    earlyBranch?: boolean; // branch decided in ID (1) instead of MEM (3)
    prediction?: boolean; // guess the branch instead of stalling
    predictTaken?: boolean; // guess taken instead of not taken
    delaySlot?: boolean;
    jumpInId?: boolean; // j decided in ID (1) instead of MEM (3)
}

// skip $zero, it is always 0 and can't really be a dependency
function keepReal(register: number): boolean {
    return register !== 0;
}

// find which registers an instruction reads and writes
export function registerRoles(fields: MipsInstructionFields): RegisterRoles {
    const { mnemonic, rs, rt, rd } = fields;
    const sources: number[] = [];
    let dest: number | null = null;
    let isLoad = false;

    switch (mnemonic) {
        case 'add':
        case 'sub':
        case 'and':
        case 'or':
        case 'nor':
        case 'slt':
            dest = rd;
            sources.push(rs, rt);
            break;
        case 'sll':
        case 'srl':
            dest = rd;
            sources.push(rt);
            break;
        case 'addi':
        case 'andi':
        case 'ori':
            dest = rt;
            sources.push(rs);
            break;
        case 'lui':
            dest = rt;
            break;
        case 'lw':
            dest = rt;
            sources.push(rs);
            isLoad = true;
            break;
        case 'sw':
            sources.push(rs, rt);
            break;
        case 'beq':
        case 'bne':
            sources.push(rs, rt);
            break;
        case 'j':
        default:
            break;
    }

    return {
        dest: dest !== null && keepReal(dest) ? dest : null,
        sources: sources.filter(keepReal),
        isLoad,
    };
}

interface Producer {
    row: number;
    startCycle: number;
    isLoad: boolean;
}

// earliest cycle the next instruction can start without breaking the dependency.
// no forwarding: wait for write-back (+3). with forwarding: +1 for ALU, +2 for
// a load (load value is only ready one stage later).
function earliestStart(producer: Producer, forwarding: boolean): number {
    if (!forwarding) {
        return producer.startCycle + 3;
    }
    return producer.startCycle + (producer.isLoad ? 2 : 1);
}

export function buildHazardSchedule(
    items: ScheduleItem[],
    options: HazardOptions,
): HazardSchedule {
    const { forwarding } = options;
    const earlyBranch = options.earlyBranch ?? false;
    const prediction = options.prediction ?? false;
    const delaySlot = options.delaySlot ?? false;
    // branch costs 1 cycle if decided early (ID), else 3 (MEM)
    const branchPenalty = earlyBranch ? 1 : 3;

    const lastWriter = new Map<number, Producer>();
    const instructions: HazardScheduledInstruction[] = [];
    const forwardEdges: ForwardEdge[] = [];
    let nextStart = 1;
    let pendingControl = 0; // bubbles the last branch owes the next instruction
    let pendingControlKind: StallCase | null = null; // what caused those bubbles
    let totalStalls = 0;
    let totalFlushes = 0;

    for (const item of items) {
        const row = instructions.length;
        const roles = registerRoles(item.fields);
        const isControl = item.isControl ?? false;
        // an early branch reads its registers in ID (one stage sooner)
        const consumesEarly = isControl && earlyBranch;

        // that only adds a stall when forwarding is on (forward to ID is one
        // cycle later than to EX). without forwarding it waits for WB anyway.
        const earlyOperandPenalty = consumesEarly && forwarding ? 1 : 0;

        let dataBase = 0;
        let dataProducer: Producer | null = null; // the one causing the stall
        const producers: Producer[] = [];
        for (const source of roles.sources) {
            const producer = lastWriter.get(source);
            if (producer) {
                producers.push(producer);
                const required =
                    earliestStart(producer, forwarding) + earlyOperandPenalty;
                if (required > dataBase) {
                    dataBase = required;
                    dataProducer = producer;
                }
            }
        }

        const controlStart = nextStart + pendingControl;
        const startCycle = Math.max(controlStart, dataBase);
        const totalBubbles = startCycle - nextStart;
        const controlBubbles = Math.min(pendingControl, totalBubbles);
        const dataBubbles = totalBubbles - controlBubbles;
        totalFlushes += controlBubbles;
        totalStalls += dataBubbles;

        // a short note explaining the stall, for the tooltip
        let stallReason = '';
        if (totalBubbles > 0) {
            if (dataBase > controlStart && dataProducer) {
                const n = dataProducer.row + 1;
                stallReason = dataProducer.isLoad
                    ? `Load-use hazard: needs the value loaded by instruction ${n} (lw), which is only ready after its MEM stage.`
                    : `Data hazard: needs a register written by instruction ${n}, which has not reached write-back yet.`;
            } else {
                stallReason =
                    'Control hazard: the previous branch or jump is not resolved yet, so the pipeline waits before this instruction.';
            }
        }

        // classify the stall into the lecture delay-table rows
        const stallCases: StallCase[] = [];
        if (controlBubbles > 0 && pendingControlKind) {
            stallCases.push(pendingControlKind);
        }
        if (dataBubbles > 0 && dataProducer) {
            if (consumesEarly && forwarding) {
                stallCases.push(
                    dataProducer.isLoad ? 'loadBranchId' : 'rawBranchId',
                );
            } else {
                stallCases.push(dataProducer.isLoad ? 'load' : 'raw');
            }
        }
        pendingControl = 0;
        pendingControlKind = null;

        // if forwarding is on, add an arrow for each dependency that still
        // needs the value forwarded (not yet written back)
        const consumeCell = startCycle + (consumesEarly ? 1 : 2);
        if (forwarding) {
            for (const producer of producers) {
                if (startCycle < producer.startCycle + 3) {
                    forwardEdges.push({
                        fromRow: producer.row,
                        fromCycle:
                            producer.startCycle + (producer.isLoad ? 3 : 2),
                        toRow: row,
                        toCycle: consumeCell,
                        fromLoad: producer.isLoad,
                    });
                }
            }
        }

        instructions.push({
            text: item.text,
            line: item.line ?? 0,
            startCycle,
            stallBefore: totalBubbles,
            stallReason,
            stallCases,
            ...roles,
        });

        if (roles.dest !== null) {
            lastWriter.set(roles.dest, {
                row,
                startCycle,
                isLoad: roles.isLoad,
            });
        }

        if (item.isJump) {
            // j always jumps, 1 cycle if decided in ID else 3
            pendingControl = (options.jumpInId ?? true) ? 1 : 3;
            pendingControlKind = pendingControl > 0 ? 'jump' : null;
        } else if (isControl) {
            // with prediction, a correct guess is free and a wrong one flushes;
            // without prediction the branch always stalls
            let base = branchPenalty;
            if (prediction) {
                const guessTaken = options.predictTaken ?? false;
                base = item.taken === guessTaken ? 0 : branchPenalty;
            }
            pendingControl = Math.max(0, base - (delaySlot ? 1 : 0));
            pendingControlKind =
                pendingControl > 0
                    ? earlyBranch
                        ? 'branchId'
                        : 'branchMem'
                    : null;
        }

        nextStart = startCycle + 1;
    }

    const totalCycles =
        instructions.length === 0
            ? 0
            : instructions[instructions.length - 1].startCycle +
              PIPELINE_STAGES.length -
              1;

    return {
        instructions,
        totalCycles,
        totalStalls,
        totalFlushes,
        forwardEdges,
    };
}
