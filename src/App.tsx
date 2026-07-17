import { useState } from 'react';
import {
    createInitialMachineState,
    type MachineState,
} from './core/mips/single-cycle/execution/machineState';
import DatapathPage from './features/datapath/DatapathPage';
import AssemblyPage from './features/assembly/AssemblyPage';
import KMapPage from './features/kmap/KMapPage';
import PipelinePage from './features/pipeline/PipelinePage';
import { DEFAULT_PIPELINE_PROGRAM } from './features/pipeline/defaultProgram';
import Modal from './features/datapath/components/Modal';
import { usePersistentState } from './hooks/usePersistentState';

type Tab = 'datapath' | 'assembly' | 'kmap' | 'pipeline';

const tabs: { id: Tab; label: string }[] = [
    { id: 'datapath', label: 'Datapath' },
    { id: 'assembly', label: 'Assembly' },
    { id: 'kmap', label: 'Karnaugh Maps' },
    { id: 'pipeline', label: 'Pipeline' },
];

// Demo "How to use" content. Only the Datapath tab is filled in for now.
const howToUse: Record<Tab, { intro: string; steps: string[] }> = {
    datapath: {
        intro: 'See how one MIPS instruction flows through the single-cycle datapath, stage by stage.',
        steps: [
            'Pick a mode at the top: Explore (set control signals yourself), Simulate (signals auto-filled), or Assembly (run a program).',
            'In Assembly mode, type a program in the editor and click Assemble & Load.',
            'Click a line number in the editor gutter to set a breakpoint (red dot).',
            'Use Next Stage to walk IF → ID → EX → MEM → WB; To Next Breakpoint jumps ahead to the next breakpoint.',
            'Watch the diagram highlight the active wires and components for the current stage.',
            'Click any component in the diagram to inspect its current value in the panel on the right.',
            'Prev steps back one stage; Reset restarts the program.',
            'Bonus: experiment freely — hit Edit on Control Signals to set them yourself, type new register or memory values, or edit the PC to jump straight to any instruction.',
        ],
    },
    assembly: {
        intro: 'Write a MIPS program and run it one instruction at a time, watching the registers and memory change.',
        steps: [
            'Type a program in the editor — 17 MIPS instructions are supported.',
            'Click Assemble & Load to build it; any errors are listed with their line numbers.',
            'Click a line number in the gutter to set a breakpoint (red dot).',
            'Use Next Instruction to step one at a time; To Next Breakpoint runs ahead to the next breakpoint (or the end).',
            'Watch the Registers and Memory tables update — changed values are highlighted.',
            'Back undoes one instruction; Reset restarts the program.',
            'Bonus: set starting register or memory values before running, or click Send to Pipeline to open the same program in the Pipeline tab.',
        ],
    },
    kmap: {
        intro: 'Build a Karnaugh map, group the cells, and compare your grouping with the solver’s minimal expression.',
        steps: [
            'Choose the number of variables (2 to 4) under Setup.',
            'In Edit mode, click cells to cycle 0 → 1 → X (don’t-care), or type a Boolean expression / minterm list and Apply.',
            'Pick SOP or POS for the form you want.',
            'Open the Result panel’s Solver view to see the prime implicants and the minimal expression.',
            'In Group mode, click cells or drag a rectangle over the 1/X cells to form a group, then Add.',
            'The Manual Feedback panel checks your groups for coverage and minimality against the solver.',
            'Bonus: use Practice mode (Easy/Medium/Hard → Generate) for a random map, and Expression Check to test a full answer.',
        ],
    },
    pipeline: {
        intro: 'See how instructions overlap in the 5-stage MIPS pipeline and where hazards cost extra cycles.',
        steps: [
            'Write a MIPS program and press Run to build the stage-time diagram.',
            'Each row is one executed instruction (loops unroll), labelled with its source line.',
            'Toggle the options — Forwarding, Early Branch, Prediction (with Taken / Not-taken) — and watch the cycles, CPI, stalls and flushes change.',
            'Arrows show forwarded values; red bubbles show stall cycles.',
            'Click any instruction row to open the inspector: a stage-by-stage explanation, the registers and memory, and exactly why it stalled.',
            'Bonus: set initial register/memory values before running, or load one of the presets to explore.',
        ],
    },
};

function SunIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export default function App() {
    const [tab, setTab] = usePersistentState<Tab>('cs2100:tab', 'datapath');
    const [theme, setTheme] = usePersistentState<'light' | 'dark'>(
        'cs2100:theme',
        'light',
    );
    const [showHelp, setShowHelp] = useState(false);
    const [pipelineProgram, setPipelineProgram] = usePersistentState(
        'cs2100:pipeline:program',
        DEFAULT_PIPELINE_PROGRAM,
    );
    const [pipelineInitial, setPipelineInitial] = useState<MachineState>(() =>
        createInitialMachineState(),
    );

    function sendToPipeline(source: string, machine: MachineState) {
        setPipelineProgram(source);
        setPipelineInitial({ ...machine, pc: 0 });
        setTab('pipeline');
    }

    return (
        <div
            className={`${theme === 'dark' ? 'dark bg-slate-950' : 'bg-[#eef2f3]'} flex h-screen flex-col overflow-hidden`}
        >
            <nav className="flex flex-none border-b border-slate-200 bg-[#fbfcfd] px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-4 lg:px-6">
                <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                <img
                                    src="/logo.png"
                                    alt=""
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                />
                            </div>

                            <div>
                                <div className="text-sm font-bold tracking-tight text-slate-950 dark:text-slate-50">
                                    CS2100 Visualizer
                                </div>
                                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    MIPS and logic practice
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 rounded-md bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                            {tabs.map(({ id, label }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setTab(id)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition sm:px-4 ${
                                        tab === id
                                            ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-600 dark:text-white'
                                            : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-white'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label={
                                theme === 'dark'
                                    ? 'Switch to light mode'
                                    : 'Switch to dark mode'
                            }
                            title={
                                theme === 'dark' ? 'Light mode' : 'Dark mode'
                            }
                            onClick={() =>
                                setTheme(theme === 'dark' ? 'light' : 'dark')
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </button>

                        <button
                            type="button"
                            aria-label="How to use"
                            title="How to use"
                            onClick={() => setShowHelp(true)}
                            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white py-1 pl-4 pr-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                            How to use
                            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-bold dark:border-slate-600">
                                ?
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="min-h-0 flex-1 overflow-auto">
                {tab === 'datapath' ? (
                    <DatapathPage />
                ) : tab === 'assembly' ? (
                    <AssemblyPage onSendToPipeline={sendToPipeline} />
                ) : tab === 'kmap' ? (
                    <KMapPage />
                ) : (
                    <PipelinePage
                        program={pipelineProgram}
                        onProgramChange={setPipelineProgram}
                        initialMachine={pipelineInitial}
                        onInitialMachineChange={setPipelineInitial}
                    />
                )}
            </div>

            {showHelp && (
                <Modal
                    title={`How to use — ${tabs.find((t) => t.id === tab)?.label}`}
                    onClose={() => setShowHelp(false)}
                >
                    <p className="text-sm text-slate-600">
                        {howToUse[tab].intro}
                    </p>
                    {howToUse[tab].steps.length > 0 && (
                        <ol className="mt-4 space-y-2">
                            {howToUse[tab].steps.map((step, index) => (
                                <li
                                    key={index}
                                    className="flex gap-3 text-sm text-slate-700"
                                >
                                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Modal>
            )}
        </div>
    );
}
