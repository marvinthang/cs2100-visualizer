import { useRef } from 'react';
import {
    assembleProgram,
    type AssembleResult,
} from '../../../core/mips/assembly/assembleProgram';
import type { DatapathStep } from '../../../types/mips';
import { usePersistentState } from '../../../hooks/usePersistentState';

const EXAMPLE_SOURCE = `# type MIPS assembly here
addi $t0, $zero, 5
addi $t1, $zero, 3
add $t2, $t0, $t1
loop:
beq $t2, $zero, loop`;

function toHex(word: number): string {
    return `0x${(word >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

type AssemblyEditorProps = {
    onLoad: (source: string) => AssembleResult;
    programLoaded: boolean;
    programIndex: number;
    programFinished: boolean;
    step: DatapathStep | null;
    isFirstStep: boolean;
    isLastStep: boolean;
    breakpoints: Set<number>;
    onToggleBreakpoint: (line: number) => void;
    onNextStep: () => void;
    onRunToBreakpoint: () => void;
    onPrev: () => void;
    onReset: () => void;
};

export default function AssemblyEditor({
    onLoad,
    programLoaded,
    programIndex,
    programFinished,
    step,
    isFirstStep,
    isLastStep,
    breakpoints,
    onToggleBreakpoint,
    onNextStep,
    onRunToBreakpoint,
    onPrev,
    onReset,
}: AssemblyEditorProps) {
    const [source, setSource] = usePersistentState(
        'cs2100:datapath:source',
        EXAMPLE_SOURCE,
    );
    const gutterRef = useRef<HTMLDivElement>(null);
    const lineNumbers = source.split('\n').map((_, i) => i + 1);

    const program = assembleProgram(source);
    const hasErrors = program.errors.length > 0;

    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/60 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Assembly
                </h2>
                <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {program.instructions.length} inst
                </span>
            </div>

            <div className="p-3">
                <div className="flex h-40 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs leading-5 shadow-sm focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100">
                    <div
                        ref={gutterRef}
                        className="select-none overflow-hidden border-r border-slate-200 dark:border-slate-800 py-2 pl-2 pr-2 text-right text-slate-400 dark:text-slate-500"
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
                        className="flex-1 resize-none overflow-x-auto whitespace-pre bg-transparent px-3 py-2 leading-5 text-slate-900 dark:text-slate-100 outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => onLoad(source)}
                    disabled={hasErrors || program.instructions.length === 0}
                    className="mt-3 w-full rounded-md bg-slate-900 dark:bg-slate-600 px-3 py-2 text-xs font-semibold text-white dark:text-white shadow-sm transition hover:bg-slate-800 dark:hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:disabled:opacity-40"
                >
                    Assemble &amp; Load
                </button>

                {/* step execution: advance one stage, run to the next breakpoint,
                    step back, or reset. Set breakpoints by clicking a line number. */}
                <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onNextStep}
                            disabled={!programLoaded || isLastStep}
                            className="flex-1 rounded-md bg-slate-900 dark:bg-slate-600 px-3 py-2 text-xs font-semibold text-white dark:text-white shadow-sm transition hover:bg-slate-800 dark:hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:disabled:opacity-40"
                        >
                            Next Stage
                        </button>
                        <button
                            type="button"
                            onClick={onRunToBreakpoint}
                            disabled={!programLoaded || programFinished}
                            className="flex-1 rounded-md bg-slate-900 dark:bg-slate-600 px-3 py-2 text-xs font-semibold text-white dark:text-white shadow-sm transition hover:bg-slate-800 dark:hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:disabled:opacity-40"
                        >
                            To Next Breakpoint
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onPrev}
                            disabled={isFirstStep}
                            className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            disabled={!programLoaded}
                            className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/60 px-3 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {!programLoaded
                            ? 'Not loaded'
                            : programFinished
                              ? 'Program finished'
                              : `Running instruction #${programIndex + 1}${
                                    step ? ` — ${step} stage` : ''
                                }`}
                    </div>
                </div>

                {program.instructions.length > 0 && (
                    <ul className="mt-3 max-h-36 space-y-1 overflow-auto rounded-md border border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/60 p-2 font-mono text-xs">
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

                {hasErrors && (
                    <ul className="mt-3 space-y-1 text-xs text-red-600">
                        {program.errors.map((error) => (
                            <li key={`${error.line}-${error.message}`}>
                                line {error.line}: {error.message}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
