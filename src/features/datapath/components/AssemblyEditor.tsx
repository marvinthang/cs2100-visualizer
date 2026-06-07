import { useMemo, useState } from 'react';
import {
    assembleProgram,
    type AssembleResult,
} from '../../../core/mips/assembly/assembleProgram';

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
};

export default function AssemblyEditor({
    onLoad,
    programLoaded,
    programIndex,
    programFinished,
}: AssemblyEditorProps) {
    const [source, setSource] = useState(EXAMPLE_SOURCE);

    const program = useMemo(() => assembleProgram(source), [source]);
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
                <textarea
                    spellCheck={false}
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className="h-36 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />

                <button
                    type="button"
                    onClick={() => onLoad(source)}
                    disabled={hasErrors || program.instructions.length === 0}
                    className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Assemble &amp; Load
                </button>

                {program.instructions.length > 0 && (
                    <ul className="mt-3 max-h-36 space-y-1 overflow-auto rounded-md border border-slate-200 bg-[#fbfcfd] p-2 font-mono text-xs">
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
