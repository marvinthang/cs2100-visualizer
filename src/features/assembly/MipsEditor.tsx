import { useRef } from 'react';
import { assembleMipsProgram } from '../../core/mips/assembly/assembleMipsProgram';
import { usePersistentState } from '../../hooks/usePersistentState';

const EXAMPLE_SOURCE = `# 17 instructions supported
lui $t0, 0x1
ori $t0, $t0, 0x234
addi $t1, $zero, 5
sll $t2, $t1, 2
sub $t3, $t2, $t1`;

function toHex(word: number): string {
    return `0x${(word >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

type MipsEditorProps = {
    onLoad: (source: string) => void;
    onSendToPipeline?: (source: string) => void;
    onSendToCache?: (source: string) => void;
    programLoaded: boolean;
    programIndex: number;
    programFinished: boolean;
    breakpoints: Set<number>;
    onToggleBreakpoint: (line: number) => void;
    onStep: () => void;
    onRunToBreakpoint: () => void;
    onBack: () => void;
    onReset: () => void;
    canStepBack: boolean;
};

export default function MipsEditor({
    onLoad,
    onSendToPipeline,
    onSendToCache,
    programLoaded,
    programIndex,
    programFinished,
    breakpoints,
    onToggleBreakpoint,
    onStep,
    onRunToBreakpoint,
    onBack,
    onReset,
    canStepBack,
}: MipsEditorProps) {
    const [source, setSource] = usePersistentState(
        'cs2100:assembly:source',
        EXAMPLE_SOURCE,
    );
    const gutterRef = useRef<HTMLDivElement>(null);
    const lineNumbers = source.split('\n').map((_, i) => i + 1);

    const program = assembleMipsProgram(source);
    const hasErrors = program.errors.length > 0;

    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Assembly
                </h2>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    {program.instructions.length} inst
                </span>
            </div>

            <div className="p-3">
                <div className="flex h-64 rounded-md border border-slate-300 bg-white font-mono text-xs leading-5 shadow-sm focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100 dark:border-slate-700 dark:bg-slate-950">
                    <div
                        ref={gutterRef}
                        className="group/gutter select-none overflow-hidden border-r border-slate-200 py-2 pl-2 pr-2 text-right text-slate-400 dark:border-slate-800 dark:text-slate-500"
                    >
                        {lineNumbers.map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onToggleBreakpoint(n)}
                                title="Toggle breakpoint"
                                className="flex h-5 w-full items-center justify-end gap-1.5 leading-5 hover:text-slate-600 dark:hover:text-slate-400"
                            >
                                <span
                                    className={`h-2 w-2 shrink-0 rounded-full ${
                                        breakpoints.has(n)
                                            ? 'bg-red-500'
                                            : 'bg-transparent hover:bg-red-200'
                                    }`}
                                />
                                {n}
                            </button>
                        ))}
                    </div>
                    <textarea
                        wrap="off"
                        spellCheck={false}
                        value={source}
                        onChange={(event) => setSource(event.target.value)}
                        onScroll={(event) => {
                            if (gutterRef.current) {
                                gutterRef.current.scrollTop =
                                    event.currentTarget.scrollTop;
                            }
                        }}
                        className="flex-1 resize-none overflow-x-auto whitespace-pre bg-transparent px-3 py-2 leading-5 text-slate-900 outline-none dark:text-slate-100"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => onLoad(source)}
                    disabled={hasErrors || program.instructions.length === 0}
                    className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
                >
                    Assemble &amp; Load
                </button>

                {onSendToPipeline && (
                    <button
                        type="button"
                        onClick={() => onSendToPipeline(source)}
                        disabled={
                            hasErrors || program.instructions.length === 0
                        }
                        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        Send to Pipeline →
                    </button>
                )}

                {onSendToCache && (
                    <button
                        type="button"
                        onClick={() => onSendToCache(source)}
                        disabled={
                            hasErrors || program.instructions.length === 0
                        }
                        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        Send to Cache →
                    </button>
                )}

                {/* step execution: run one instruction, run to the next breakpoint,
                    step back, or reset. Set breakpoints by clicking a line number. */}
                <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onStep}
                            disabled={!programLoaded || programFinished}
                            className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
                        >
                            Next Instruction
                        </button>
                        <button
                            type="button"
                            onClick={onRunToBreakpoint}
                            disabled={!programLoaded || programFinished}
                            className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
                        >
                            To Next Breakpoint
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={!canStepBack}
                            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            disabled={!programLoaded}
                            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-[#fbfcfd] px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                        {!programLoaded
                            ? 'Not loaded'
                            : programFinished
                              ? 'Program finished'
                              : `Running instruction #${programIndex + 1}`}
                    </div>
                </div>

                {program.instructions.length > 0 && (
                    <ul className="mt-3 max-h-64 space-y-1 overflow-auto rounded-md border border-slate-200 bg-[#fbfcfd] p-2 font-mono text-xs dark:border-slate-800 dark:bg-slate-900/60">
                        {program.instructions.map((instruction) => {
                            const isActive =
                                programLoaded &&
                                !programFinished &&
                                instruction.index === programIndex;

                            return (
                                <li
                                    key={instruction.index}
                                    className={`flex items-center justify-between gap-3 rounded-md px-2 py-1 ${
                                        isActive
                                            ? 'bg-amber-100 text-slate-950'
                                            : 'text-slate-700 dark:text-slate-200'
                                    }`}
                                >
                                    <span>{instruction.text}</span>
                                    <span className="shrink-0 text-slate-400 dark:text-slate-400">
                                        {toHex(instruction.word)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}
