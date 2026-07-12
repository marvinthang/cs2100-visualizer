import { useRef, useState } from 'react';
import {
    assembleMipsProgram,
    type AssembleMipsResult,
} from '../../core/mips/assembly/assembleMipsProgram';

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
    onLoad: (source: string) => AssembleMipsResult;
    onSendToPipeline?: (source: string) => void;
    programLoaded: boolean;
    programIndex: number;
    programFinished: boolean;
};

export default function MipsEditor({
    onLoad,
    onSendToPipeline,
    programLoaded,
    programIndex,
    programFinished,
}: MipsEditorProps) {
    const [source, setSource] = useState(EXAMPLE_SOURCE);
    const gutterRef = useRef<HTMLDivElement>(null);
    const lineNumbers = source.split('\n').map((_, i) => i + 1);

    const program = assembleMipsProgram(source);
    const hasErrors = program.errors.length > 0;

    return (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcfd] px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    Assembly
                </h2>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                    {program.instructions.length} inst
                </span>
            </div>

            <div className="p-3">
                <div className="flex h-64 rounded-md border border-slate-300 bg-white font-mono text-xs leading-5 shadow-sm focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100">
                    <div
                        ref={gutterRef}
                        className="select-none overflow-hidden border-r border-slate-200 py-2 pl-3 pr-2 text-right text-slate-400"
                    >
                        {lineNumbers.map((n) => (
                            <div key={n}>{n}</div>
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
                        className="flex-1 resize-none overflow-x-auto whitespace-pre bg-transparent px-3 py-2 leading-5 text-slate-900 outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => onLoad(source)}
                    disabled={hasErrors || program.instructions.length === 0}
                    className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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
                        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Send to Pipeline →
                    </button>
                )}

                {program.instructions.length > 0 && (
                    <ul className="mt-3 max-h-64 space-y-1 overflow-auto rounded-md border border-slate-200 bg-[#fbfcfd] p-2 font-mono text-xs">
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
                                            : 'text-slate-700'
                                    }`}
                                >
                                    <span>{instruction.text}</span>
                                    <span className="shrink-0 text-slate-400">
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
