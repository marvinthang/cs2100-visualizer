import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { assembleMipsProgram } from '../../core/mips/assembly/assembleMipsProgram';
import { registerNames } from '../../core/mips/instruction/registers';
import type { MachineState } from '../../core/mips/single-cycle/execution/machineState';
import type { MachineStateHighlightState } from '../../core/mips/single-cycle/highlight/types';
import type { MipsInstructionFields, RegisterNumber } from '../../types/mips';
import {
    buildHazardSchedule,
    type HazardSchedule,
    type HazardScheduledInstruction,
    registerRoles,
    type StallCase,
} from '../../core/pipeline/hazards';
import type { TraceStep } from '../../core/pipeline/trace';
import MemoryTable from '../datapath/components/MemoryTable';
import Modal, { ExpandButton } from '../datapath/components/Modal';
import RegisterTable from '../datapath/components/RegisterTable';

const EMPTY_HIGHLIGHT: MachineStateHighlightState = {
    registers: {},
    memory: {},
};
import {
    type PipelineStage,
    stageAtCycle,
} from '../../core/pipeline/schedule';
import { buildExecutionTrace } from '../../core/pipeline/trace';

const STAGE_STYLES: Record<PipelineStage, string> = {
    IF: 'bg-sky-100 text-sky-700',
    ID: 'bg-indigo-100 text-indigo-700',
    EX: 'bg-violet-100 text-violet-700',
    MEM: 'bg-amber-100 text-amber-700',
    WB: 'bg-emerald-100 text-emerald-700',
};

// The lecture delay table (why.jpeg): label + the +cycles each case costs,
// without vs with forwarding. null = the case does not occur in that column.
const STALL_CASE_INFO: Record<
    StallCase,
    { label: string; noFwd: number | null; fwd: number | null }
> = {
    raw: { label: 'RAW', noFwd: 2, fwd: 0 },
    load: { label: 'Load Word', noFwd: 2, fwd: 1 },
    branchMem: { label: 'Branch at MEM', noFwd: 3, fwd: 3 },
    branchId: { label: 'Branch at ID', noFwd: 1, fwd: 1 },
    rawBranchId: { label: 'RAW + Branch at ID', noFwd: null, fwd: 1 },
    loadBranchId: { label: 'Load + Branch at ID', noFwd: null, fwd: 2 },
    jump: { label: 'Jump', noFwd: 3, fwd: 1 },
};

// what each stage does for one instruction
function describeStages(
    fields: MipsInstructionFields,
): { stage: PipelineStage; text: string }[] {
    const roles = registerRoles(fields);
    const m = fields.mnemonic;
    const ex =
        m === 'lw' || m === 'sw'
            ? 'Add the base register and offset to get the memory address.'
            : m === 'beq' || m === 'bne'
              ? 'Compare the two registers to decide if the branch is taken.'
              : m === 'j'
                ? 'No ALU work, the jump target is already known.'
                : 'Do the ALU operation.';
    const mem =
        m === 'lw'
            ? 'Read the word from data memory.'
            : m === 'sw'
              ? 'Write the register value into data memory.'
              : 'Nothing happens in memory.';
    const wb =
        roles.dest !== null
            ? `Write the result into ${registerNames[roles.dest]}.`
            : 'Nothing to write back.';
    return [
        { stage: 'IF', text: 'Fetch this instruction from memory.' },
        { stage: 'ID', text: 'Decode it and read its registers.' },
        { stage: 'EX', text: ex },
        { stage: 'MEM', text: mem },
        { stage: 'WB', text: wb },
    ];
}

// read-only list of the 32 registers; changed ones are highlighted
function RegisterList({
    registers,
    changed,
}: {
    registers: Record<number, number>;
    changed: Set<number>;
}) {
    return (
        <div className="grid grid-cols-2 gap-x-3 font-mono text-[11px]">
            {registerNames.map((name, num) => (
                <div
                    key={num}
                    className={`flex justify-between ${
                        changed.has(num)
                            ? 'font-semibold text-rose-600'
                            : 'text-slate-600'
                    }`}
                >
                    <span>{name}</span>
                    <span>{registers[num] ?? 0}</span>
                </div>
            ))}
        </div>
    );
}

// read-only list of data memory words; changed ones are highlighted
function MemoryList({
    memory,
    changed,
}: {
    memory: Record<number, number>;
    changed: Set<number>;
}) {
    const addresses = Object.keys(memory)
        .map(Number)
        .sort((a, b) => a - b);
    return (
        <div className="grid grid-cols-2 gap-x-3 font-mono text-[11px]">
            {addresses.map((addr) => (
                <div
                    key={addr}
                    className={`flex justify-between ${
                        changed.has(addr)
                            ? 'font-semibold text-rose-600'
                            : 'text-slate-600'
                    }`}
                >
                    <span>[{addr}]</span>
                    <span>{memory[addr]}</span>
                </div>
            ))}
        </div>
    );
}

// a default program where every toggle changes the cycle count:
// the lw + add chain shows forwarding, the taken beq shows early branch,
// the not-taken beq shows prediction
export const DEFAULT_PIPELINE_PROGRAM = [
    'addi $1, $zero, 1',
    'lw   $2, 0($0)',
    'add  $3, $2, $1',
    'add  $4, $3, $1',
    'add  $5, $4, $1',
    'add  $6, $5, $1',
    'beq  $0, $0, T0',
    'add  $7, $1, $1',
    'T0: add $8, $1, $1',
    'beq  $1, $0, N1',
    'N1: add $9, $1, $1',
].join('\n');

// example programs from the lecture / tutorial
const PRESETS: { name: string; program: string }[] = [
    { name: 'Default', program: DEFAULT_PIPELINE_PROGRAM },
    {
        name: 'ALU chain',
        program: [
            'sub $2, $1, $3',
            'and $12, $2, $5',
            'or  $13, $6, $2',
            'add $14, $2, $2',
            'sw  $15, 100($2)',
        ].join('\n'),
    },
    {
        name: 'Load-use',
        program: [
            'lw  $2, 20($3)',
            'and $12, $2, $5',
            'or  $13, $6, $2',
            'add $14, $2, $2',
            'sw  $15, 100($2)',
        ].join('\n'),
    },
    {
        name: 'Loop',
        program: [
            'addi $s0, $zero, 10',
            'Loop: addi $s0, $s0, -1',
            'bne $s0, $zero, Loop',
            'sub $t0, $t1, $t2',
        ].join('\n'),
    },
    {
        name: 'Jump',
        program: ['j Skip', 'add $1, $2, $3', 'Skip: add $4, $5, $6'].join(
            '\n',
        ),
    },
];

type OptionId = 'forwarding' | 'earlyBranch' | 'prediction' | 'jumpInId';

type Option = { id: OptionId; label: string; info: string };

// the three main toggles
const OPTIONS: Option[] = [
    {
        id: 'forwarding',
        label: 'Forwarding',
        info: 'Bypass an ALU result straight to a later instruction so a RAW dependency does not wait for write-back. OFF inserts stall bubbles instead.',
    },
    {
        id: 'earlyBranch',
        label: 'Early Branch',
        info: 'Resolve the branch in the ID stage (1-cycle penalty). OFF resolves it in MEM (3-cycle penalty).',
    },
    {
        id: 'prediction',
        label: 'Prediction',
        info: 'Guess the branch direction and keep fetching; a correct guess costs nothing, a wrong one flushes. Pick Taken or Not taken below. OFF stalls until the branch is known.',
    },
];

// extra toggle, kept separate from the main ones
const OPTIONAL_OPTIONS: Option[] = [
    {
        id: 'jumpInId',
        label: 'Jump in ID',
        info: 'The j instruction computes its target in the ID stage (1-cycle penalty). OFF resolves it in MEM (3-cycle penalty).',
    },
];

const LIMIT_MAX = 1000;

// Free-text limit box: lets the user clear and retype digits without snapping.
// Validation / clamping happens when Apply is pressed, not per keystroke.
function LimitBox({
    label,
    value,
    onChange,
    onApply,
}: {
    label: string;
    value: string;
    onChange: (next: string) => void;
    onApply: () => void;
}) {
    return (
        <label className="flex items-center gap-1.5">
            {label}
            <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => {
                    // keep digits only, allow empty while typing
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    onChange(digits);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onApply();
                }}
                className="w-24 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
            />
        </label>
    );
}

function Segmented({
    value,
    onChange,
    onLabel = 'ON',
    offLabel = 'OFF',
}: {
    value: boolean;
    onChange: (next: boolean) => void;
    onLabel?: string;
    offLabel?: string;
}) {
    return (
        <div className="grid grid-cols-2 rounded-md bg-slate-100 p-0.5 ring-1 ring-slate-200">
            {[
                { active: value, label: onLabel, next: true },
                { active: !value, label: offLabel, next: false },
            ].map(({ active, label, next }) => (
                <button
                    key={label}
                    type="button"
                    onClick={() => onChange(next)}
                    className={`min-w-12 rounded px-2 py-1 text-center text-xs font-semibold transition ${
                        active
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white/70 hover:text-slate-950'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

function InfoDot({
    text,
    open,
    onToggle,
    onHover,
}: {
    text: string;
    open: boolean;
    onToggle: () => void;
    onHover: (over: boolean) => void;
}) {
    return (
        <span className="relative inline-flex">
            <button
                type="button"
                onClick={onToggle}
                onMouseEnter={() => onHover(true)}
                onMouseLeave={() => onHover(false)}
                aria-label="What does this do?"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500 hover:border-slate-400 hover:text-slate-700"
            >
                i
            </button>
            {open ? (
                <span className="absolute left-5 top-0 z-50 w-56 whitespace-normal rounded-md border border-slate-200 bg-white p-2 text-[11px] leading-snug text-slate-600 shadow-md">
                    {text}
                </span>
            ) : null}
        </span>
    );
}

// Stage-by-stage explanation of the selected instruction plus its stall reason.
function InstructionDetail({
    selStep,
    selInstr,
    forwarding,
}: {
    selStep: TraceStep | null;
    selInstr: HazardScheduledInstruction | null;
    forwarding: boolean;
}) {
    return (
        <div className="flex flex-col gap-4">
            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Instruction Details
                </h2>
                {selStep ? (
                    <div>
                        <p className="mb-2 font-mono text-sm font-semibold text-slate-900">
                            <span className="text-slate-400">
                                Line {selStep.line}:
                            </span>{' '}
                            {selStep.text}
                        </p>
                        <div className="flex flex-col gap-1">
                            {describeStages(selStep.fields).map(
                                ({ stage, text }) => (
                                    <div
                                        key={stage}
                                        className="flex items-start gap-2"
                                    >
                                        <span
                                            className={`mt-0.5 w-9 shrink-0 rounded text-center text-[11px] font-semibold ${STAGE_STYLES[stage]}`}
                                        >
                                            {stage}
                                        </span>
                                        <span className="text-[11px] leading-snug text-slate-600">
                                            {text}
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">
                            Click any row in the diagram to inspect it.
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">
                        Type a program to inspect its instructions.
                    </p>
                )}
            </section>

            {selInstr && selInstr.stallBefore > 0 ? (
                <section className="rounded-md border border-rose-200 bg-rose-50 p-3 shadow-sm">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400">
                        Why it stalls ({selInstr.stallBefore} bubble
                        {selInstr.stallBefore > 1 ? 's' : ''})
                    </h2>
                    <p className="text-[11px] leading-snug text-rose-700">
                        {selInstr.stallReason}
                    </p>
                    {selInstr.stallCases.length > 0 ? (
                        <div className="mt-2 flex flex-col gap-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-400">
                                {forwarding
                                    ? 'With forwarding'
                                    : 'Without forwarding'}
                            </p>
                            {selInstr.stallCases.map((c, i) => {
                                const info = STALL_CASE_INFO[c];
                                const delay = forwarding
                                    ? info.fwd
                                    : info.noFwd;
                                return (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded border border-rose-200 bg-white px-2 py-1 text-[11px]"
                                    >
                                        <span className="font-semibold text-slate-700">
                                            {info.label}
                                        </span>
                                        <span className="font-mono font-semibold text-rose-600">
                                            +{delay ?? '?'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </section>
            ) : null}
        </div>
    );
}

// The scrollable stage-time grid with sticky headers and forwarding arrows.
// Self-contained (own ref + measurement) so it can render in the panel and in
// the expand modal at the same time.
function PipelineGrid({
    schedule,
    cycles,
    selRow,
    onSelectRow,
    heightClass,
}: {
    schedule: HazardSchedule;
    cycles: number[];
    selRow: number;
    onSelectRow: (row: number) => void;
    heightClass: string;
}) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [arrows, setArrows] = useState<
        { x1: number; y1: number; x2: number; y2: number; load: boolean }[]
    >([]);
    useLayoutEffect(() => {
        const compute = () => {
            const grid = gridRef.current;
            if (!grid) {
                setArrows([]);
                return;
            }
            const base = grid.getBoundingClientRect();
            const cell = (row: number, cycle: number) =>
                grid.querySelector(`[data-cell="${row}-${cycle}"]`);
            const next = [];
            for (const edge of schedule.forwardEdges) {
                const from = cell(edge.fromRow, edge.fromCycle);
                const to = cell(edge.toRow, edge.toCycle);
                if (!from || !to) continue;
                const a = from.getBoundingClientRect();
                const b = to.getBoundingClientRect();
                next.push({
                    x1: a.left - base.left + a.width / 2,
                    y1: a.top - base.top + a.height,
                    x2: b.left - base.left + b.width / 2,
                    y2: b.top - base.top,
                    load: edge.fromLoad,
                });
            }
            setArrows(next);
        };
        compute();
        window.addEventListener('resize', compute);
        return () => window.removeEventListener('resize', compute);
    }, [schedule, cycles.length]);

    return (
        <div className={`overflow-auto ${heightClass}`}>
            <div ref={gridRef} className="relative inline-block">
                <table className="border-separate border-spacing-1 text-xs">
                    <thead>
                        <tr>
                            <th className="sticky left-0 top-0 z-30 bg-white px-2 py-1 text-left font-semibold text-slate-400">
                                <span className="mr-2 text-slate-300">Line</span>
                                Instruction
                            </th>
                            {cycles.map((cycle) => (
                                <th
                                    key={cycle}
                                    className="sticky top-0 z-20 w-9 bg-white px-1 py-1 text-center font-semibold text-slate-400"
                                >
                                    {cycle}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.instructions.map((instruction, row) => (
                            <tr
                                key={row}
                                onClick={() => onSelectRow(row)}
                                className={`cursor-pointer ${
                                    row === selRow
                                        ? 'bg-slate-100'
                                        : 'hover:bg-slate-50'
                                }`}
                            >
                                <td
                                    className={`sticky left-0 z-10 whitespace-nowrap px-2 py-1 font-mono text-slate-700 ${
                                        row === selRow
                                            ? 'bg-slate-100'
                                            : 'bg-white'
                                    }`}
                                >
                                    <span className="mr-3 inline-block w-6 text-right text-slate-400">
                                        {instruction.line}
                                    </span>
                                    {instruction.text}
                                </td>
                                {cycles.map((cycle) => {
                                    const stage = stageAtCycle(
                                        instruction,
                                        cycle,
                                    );
                                    const isBubble =
                                        !stage &&
                                        cycle >=
                                            instruction.startCycle -
                                                instruction.stallBefore &&
                                        cycle < instruction.startCycle;
                                    return (
                                        <td
                                            key={cycle}
                                            data-cell={
                                                stage
                                                    ? `${row}-${cycle}`
                                                    : undefined
                                            }
                                            className={`h-7 w-9 rounded text-center font-semibold ${
                                                stage
                                                    ? STAGE_STYLES[stage]
                                                    : isBubble
                                                      ? 'bg-rose-100 text-rose-400'
                                                      : 'bg-slate-50'
                                            }`}
                                        >
                                            {stage ?? (isBubble ? '••' : '')}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                    aria-hidden="true"
                >
                    <defs>
                        <marker
                            id="fwd-arrow"
                            viewBox="0 0 10 10"
                            refX="8"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path
                                d="M 0 0 L 10 5 L 0 10 z"
                                className="fill-violet-500"
                            />
                        </marker>
                    </defs>
                    {arrows.map((a, i) => (
                        <path
                            key={i}
                            d={`M ${a.x1} ${a.y1} C ${a.x1} ${a.y1 + 14}, ${a.x2} ${a.y2 - 14}, ${a.x2} ${a.y2}`}
                            fill="none"
                            strokeWidth={1.5}
                            markerEnd="url(#fwd-arrow)"
                            className={
                                a.load ? 'stroke-amber-500' : 'stroke-violet-500'
                            }
                        />
                    ))}
                </svg>
            </div>
        </div>
    );
}

export default function PipelinePage({
    program,
    onProgramChange,
    initialMachine,
    onInitialMachineChange,
}: {
    program: string;
    onProgramChange: (next: string) => void;
    initialMachine: MachineState;
    onInitialMachineChange: (next: MachineState) => void;
}) {
    const [options, setOptions] = useState<Record<OptionId, boolean>>({
        forwarding: true,
        earlyBranch: true,
        prediction: false,
        jumpInId: true,
    });
    const [predictTaken, setPredictTaken] = useState(false);
    const [selectedRow, setSelectedRow] = useState(0);
    const [showInitial, setShowInitial] = useState(false);
    const [expanded, setExpanded] = useState<null | 'program' | 'diagram'>(
        null,
    );
    // the program + inputs that were last Run (the diagram only updates on Run)
    const [runProgram, setRunProgram] = useState(program);
    const [runMachine, setRunMachine] = useState(initialMachine);
    const [pinnedInfo, setPinnedInfo] = useState<OptionId | null>(null);
    const [hoverInfo, setHoverInfo] = useState<OptionId | null>(null);
    const [maxRows, setMaxRows] = useState(50);
    const [maxCols, setMaxCols] = useState(50);
    // draft text for the Rows / Cols boxes; committed on Apply
    const [rowsDraft, setRowsDraft] = useState('50');
    const [colsDraft, setColsDraft] = useState('50');
    const [limitInfoPinned, setLimitInfoPinned] = useState(false);
    const [limitInfoHover, setLimitInfoHover] = useState(false);
    const [presetInfoPinned, setPresetInfoPinned] = useState(false);
    const [presetInfoHover, setPresetInfoHover] = useState(false);

    // clamp a draft string to [1, LIMIT_MAX]; empty falls back to the default 50
    function clampLimit(draft: string): number {
        const n = Number(draft);
        if (!draft || Number.isNaN(n)) return 50;
        return Math.min(LIMIT_MAX, Math.max(1, Math.round(n)));
    }
    function applyLimits() {
        const rows = clampLimit(rowsDraft);
        const cols = clampLimit(colsDraft);
        setMaxRows(rows);
        setMaxCols(cols);
        setRowsDraft(String(rows));
        setColsDraft(String(cols));
    }
    const limitsDirty =
        clampLimit(rowsDraft) !== maxRows || clampLimit(colsDraft) !== maxCols;

    // editing the starting registers / memory (same behaviour as Assembly tab)
    function handleRegisterChange(register: RegisterNumber, value: number) {
        if (register === 0) return;
        onInitialMachineChange({
            ...initialMachine,
            registers: { ...initialMachine.registers, [register]: value },
        });
    }
    function handleResetRegisters() {
        onInitialMachineChange({
            ...initialMachine,
            registers: {},
        } as MachineState);
    }
    function handleMemoryChange(address: number, value: number) {
        onInitialMachineChange({
            ...initialMachine,
            dataMemory: { ...initialMachine.dataMemory, [address]: value },
        });
    }
    function handleMemoryRangeChange(startAddress: number, wordCount: number) {
        const dataMemory: Record<number, number> = {};
        const start = Math.max(0, startAddress - (startAddress % 4));
        for (let i = 0; i < wordCount; i++) {
            const addr = start + i * 4;
            dataMemory[addr] = initialMachine.dataMemory[addr] ?? 0;
        }
        onInitialMachineChange({ ...initialMachine, dataMemory });
    }
    function handleResetMemory() {
        const dataMemory: Record<number, number> = {};
        for (const addr of Object.keys(initialMachine.dataMemory).map(Number)) {
            dataMemory[addr] = 0;
        }
        onInitialMachineChange({ ...initialMachine, dataMemory });
    }

    const trace = useMemo(
        () => buildExecutionTrace(runProgram, maxRows, runMachine),
        [runProgram, maxRows, runMachine],
    );
    // check the draft for errors as the user types (line numbers)
    const draftErrors = useMemo(
        () => assembleMipsProgram(program).errors,
        [program],
    );
    // true when the editor / inputs differ from what was last Run
    const dirty = program !== runProgram || initialMachine !== runMachine;

    function runCode() {
        setRunProgram(program);
        setRunMachine(initialMachine);
        setSelectedRow(0);
    }
    const schedule = useMemo(
        () =>
            buildHazardSchedule(trace.steps, {
                forwarding: options.forwarding,
                earlyBranch: options.earlyBranch,
                prediction: options.prediction,
                predictTaken,
                jumpInId: options.jumpInId,
            }),
        [trace, options, predictTaken],
    );
    const allCycles = Array.from(
        { length: schedule.totalCycles },
        (_, i) => i + 1,
    );
    const cycles = allCycles.slice(0, maxCols);
    const colsClipped = allCycles.length > maxCols;

    // the instruction the inspector panel is showing
    const stepCount = trace.steps.length;
    const selRow = stepCount === 0 ? -1 : Math.min(selectedRow, stepCount - 1);
    const selStep = selRow >= 0 ? trace.steps[selRow] : null;
    const selInstr = selRow >= 0 ? schedule.instructions[selRow] : null;
    const prevMachine = selRow > 0 ? trace.steps[selRow - 1].machine : null;
    // which registers / memory cells changed in the selected step
    const changedRegs = new Set<number>();
    const changedMem = new Set<number>();
    if (selStep) {
        const regs = selStep.machine.registers as Record<number, number>;
        const prevRegs = prevMachine
            ? (prevMachine.registers as Record<number, number>)
            : null;
        for (let r = 0; r < registerNames.length; r++) {
            const before = prevRegs ? (prevRegs[r] ?? 0) : 0;
            if ((regs[r] ?? 0) !== before) {
                changedRegs.add(r);
            }
        }
        for (const addr of Object.keys(selStep.machine.dataMemory).map(
            Number,
        )) {
            const before = prevMachine ? (prevMachine.dataMemory[addr] ?? 0) : 0;
            if (selStep.machine.dataMemory[addr] !== before) {
                changedMem.add(addr);
            }
        }
    }

    const gutterRef = useRef<HTMLDivElement>(null);
    const lineNumbers = program.split('\n').map((_, i) => i + 1);

    // Rows / Cols + Apply, shared by the panel header and the expand modal.
    const limitControls = (
        <>
            <InfoDot
                text="Rows = max instructions shown, Cols = max cycles shown. Default 50; raise either as needed, up to 1000 maximum."
                open={limitInfoPinned || limitInfoHover}
                onToggle={() => setLimitInfoPinned((prev) => !prev)}
                onHover={setLimitInfoHover}
            />
            <LimitBox
                label="Rows"
                value={rowsDraft}
                onChange={setRowsDraft}
                onApply={applyLimits}
            />
            <LimitBox
                label="Cols"
                value={colsDraft}
                onChange={setColsDraft}
                onApply={applyLimits}
            />
            <button
                type="button"
                onClick={applyLimits}
                disabled={!limitsDirty}
                className={`rounded border px-2.5 py-1 text-sm font-semibold transition ${
                    limitsDirty
                        ? 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
            >
                Apply
            </button>
        </>
    );

    const instructionCount = schedule.instructions.length;
    const cpi =
        instructionCount === 0
            ? '—'
            : (schedule.totalCycles / instructionCount).toFixed(2);
    const counters = [
        { label: 'Cycles', value: schedule.totalCycles || '—' },
        { label: 'Instr', value: instructionCount || '—' },
        { label: 'CPI', value: cpi },
        { label: 'Stalls', value: schedule.totalStalls },
        { label: 'Flushes', value: schedule.totalFlushes },
    ];

    const renderOption = ({ id, label, info }: Option) => (
        <div key={id} className="flex items-center justify-between gap-3">
            <span className="flex flex-1 items-center gap-1.5 whitespace-nowrap text-sm text-slate-700">
                {label}
                <InfoDot
                    text={info}
                    open={pinnedInfo === id || hoverInfo === id}
                    onToggle={() =>
                        setPinnedInfo((prev) => (prev === id ? null : id))
                    }
                    onHover={(over) => setHoverInfo(over ? id : null)}
                />
            </span>
            <Segmented
                value={options[id]}
                onChange={(next) =>
                    setOptions((prev) => ({ ...prev, [id]: next }))
                }
            />
        </div>
    );

    return (
        <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-4 p-3 sm:p-4 lg:p-6">
            <header className="rounded-lg border border-slate-200 bg-[#fbfcfd] px-4 py-3 shadow-sm">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-slate-950">
                                MIPS Pipeline Visualizer
                            </h1>
                            <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                                Hazards
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Step a MIPS program through the 5-stage pipeline and
                            watch hazards form.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {counters.map(({ label, value }) => (
                            <div
                                key={label}
                                className="min-w-[4.5rem] rounded-md border border-slate-200 bg-white px-4 py-2 text-center shadow-sm"
                            >
                                <div className="font-mono text-2xl font-bold text-slate-900">
                                    {value}
                                </div>
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <button
                    type="button"
                    onClick={() => setShowInitial((v) => !v)}
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-700"
                >
                    <span>Initial Register / Memory Values</span>
                    <span>{showInitial ? 'hide' : 'edit'}</span>
                </button>
                {showInitial ? (
                    <div className="mt-3 grid items-start gap-4 md:grid-cols-2">
                        <RegisterTable
                            machine={initialMachine}
                            onRegisterChange={handleRegisterChange}
                            onResetRegisters={handleResetRegisters}
                            machineHighlight={EMPTY_HIGHLIGHT}
                            tableMaxHeightClass="max-h-[360px]"
                        />
                        <MemoryTable
                            machine={initialMachine}
                            onMemoryChange={handleMemoryChange}
                            onMemoryRangeChange={handleMemoryRangeChange}
                            onResetMemory={handleResetMemory}
                            machineHighlight={EMPTY_HIGHLIGHT}
                            tableMaxHeightClass="max-h-[360px]"
                        />
                    </div>
                ) : (
                    <p className="mt-2 text-[11px] text-slate-400">
                        Set starting values for registers and memory before the
                        program runs (needed when branches depend on inputs).
                    </p>
                )}
            </section>

            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
                {/* Left: program input + toggles */}
                <div className="flex flex-col gap-4">
                    <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Program
                            </h2>
                            <ExpandButton
                                onClick={() => setExpanded('program')}
                            />
                        </div>
                        <div className="flex h-48 rounded border border-slate-200 bg-slate-50 font-mono text-xs leading-5">
                            <div
                                ref={gutterRef}
                                className="select-none overflow-hidden border-r border-slate-200 py-2 pl-2 pr-1.5 text-right text-slate-400"
                            >
                                {lineNumbers.map((n) => (
                                    <div key={n}>{n}</div>
                                ))}
                            </div>
                            <textarea
                                wrap="off"
                                className="flex-1 resize-none overflow-x-auto whitespace-pre bg-transparent py-2 pl-2 pr-2 leading-5 text-slate-700 outline-none"
                                placeholder={
                                    'sub $2, $1, $3\nand $12, $2, $5\nor  $13, $6, $2'
                                }
                                spellCheck={false}
                                value={program}
                                onChange={(e) =>
                                    onProgramChange(e.target.value)
                                }
                                onScroll={(e) => {
                                    if (gutterRef.current) {
                                        gutterRef.current.scrollTop =
                                            e.currentTarget.scrollTop;
                                    }
                                }}
                            />
                        </div>
                        {draftErrors.length > 0 ? (
                            <div className="mt-2 space-y-0.5 text-[11px] text-rose-600">
                                {draftErrors.map((e, i) => (
                                    <p key={i}>
                                        Line {e.line}: {e.message}
                                    </p>
                                ))}
                            </div>
                        ) : null}
                        {trace.truncated ? (
                            <p className="mt-2 text-[11px] text-amber-600">
                                Showing the first {instructionCount} executed
                                instructions (step limit reached — long or
                                infinite loop).
                            </p>
                        ) : null}

                        <button
                            type="button"
                            onClick={runCode}
                            className={`mt-3 w-full rounded-md px-3 py-2 text-xs font-semibold shadow-sm transition ${
                                dirty
                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                    : 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-white'
                            }`}
                        >
                            {dirty ? 'Run ▶' : 'Run again'}
                        </button>

                        <div className="mt-3 mb-1.5 flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Presets
                            </span>
                            <InfoDot
                                text="New here? Load one of these example programs and press Run, then flip the options to see how forwarding, branches and stalls change the diagram."
                                open={presetInfoPinned || presetInfoHover}
                                onToggle={() =>
                                    setPresetInfoPinned((prev) => !prev)
                                }
                                onHover={setPresetInfoHover}
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESETS.map(({ name, program: preset }) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => onProgramChange(preset)}
                                    className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Options
                        </h2>
                        <div className="flex flex-col gap-2">
                            {OPTIONS.map(renderOption)}
                            {options.prediction ? (
                                <div className="flex items-center justify-between gap-3 pl-3">
                                    <span className="text-sm text-slate-500">
                                        Guess
                                    </span>
                                    <Segmented
                                        value={predictTaken}
                                        onChange={setPredictTaken}
                                        onLabel="Taken"
                                        offLabel="Not taken"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Optional
                        </h2>
                        <div className="flex flex-col gap-2">
                            {OPTIONAL_OPTIONS.map(renderOption)}
                        </div>
                    </section>
                </div>

                {/* Right: stage-time diagram + counters */}
                <div className="flex flex-col gap-4">
                    <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Stage-Time Diagram
                            </h2>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                {limitControls}
                                <ExpandButton
                                    onClick={() => setExpanded('diagram')}
                                />
                            </div>
                        </div>
                        {colsClipped ? (
                            <p className="mb-2 text-[11px] text-amber-600">
                                Showing the first {maxCols} of {allCycles.length}{' '}
                                cycles — raise Cols to see more.
                            </p>
                        ) : null}
                        {instructionCount === 0 ? (
                            <div className="flex h-32 items-center justify-center rounded border border-dashed border-slate-200 text-sm text-slate-400">
                                Type a MIPS program to see the pipeline.
                            </div>
                        ) : (
                            <PipelineGrid
                                schedule={schedule}
                                cycles={cycles}
                                selRow={selRow}
                                onSelectRow={setSelectedRow}
                                heightClass="max-h-[28rem]"
                            />
                        )}
                    </section>
                </div>

                {/* Right: inspector — stage usage + registers + memory */}
                <div className="flex flex-col gap-4">
                    <InstructionDetail
                        selStep={selStep}
                        selInstr={selInstr}
                        forwarding={options.forwarding}
                    />

                    {selStep ? (
                        <>
                            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Registers (after #{selRow + 1})
                                </h2>
                                <RegisterList
                                    registers={selStep.machine.registers}
                                    changed={changedRegs}
                                />
                            </section>

                            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Data Memory (after #{selRow + 1})
                                </h2>
                                <MemoryList
                                    memory={selStep.machine.dataMemory}
                                    changed={changedMem}
                                />
                            </section>
                        </>
                    ) : null}
                </div>
            </div>

            {expanded === 'program' ? (
                <Modal
                    title="Program"
                    onClose={() => setExpanded(null)}
                    maxWidthClass="max-w-3xl"
                >
                    <textarea
                        wrap="off"
                        spellCheck={false}
                        value={program}
                        onChange={(e) => onProgramChange(e.target.value)}
                        className="h-[60vh] w-full resize-none overflow-auto whitespace-pre rounded border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-5 text-slate-700 outline-none"
                    />
                </Modal>
            ) : null}

            {expanded === 'diagram' && instructionCount > 0 ? (
                <Modal
                    title="Stage-Time Diagram"
                    onClose={() => setExpanded(null)}
                    maxWidthClass="max-w-[95vw]"
                >
                    <div className="flex h-[78vh] gap-4">
                        <div className="w-72 shrink-0 overflow-auto">
                            <InstructionDetail
                                selStep={selStep}
                                selInstr={selInstr}
                                forwarding={options.forwarding}
                            />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <div className="flex items-center justify-end gap-3 text-[11px] text-slate-500">
                                {limitControls}
                            </div>
                            <div className="min-h-0 flex-1">
                                <PipelineGrid
                                    schedule={schedule}
                                    cycles={cycles}
                                    selRow={selRow}
                                    onSelectRow={setSelectedRow}
                                    heightClass="h-full"
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            ) : null}
        </div>
    );
}
