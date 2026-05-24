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
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Assembly
            </h2>

            <textarea
                spellCheck={false}
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="h-48 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900"
            />

            <button
                type="button"
                onClick={() => onLoad(source)}
                disabled={hasErrors || program.instructions.length === 0}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Assemble &amp; Load
            </button>

            {program.instructions.length > 0 && (
                <ul className="mt-3 space-y-1 font-mono text-xs">
                    {program.instructions.map((instruction) => {
                        const isActive =
                            programLoaded &&
                            !programFinished &&
                            instruction.index === programIndex;

                        return (
                            <li
                                key={instruction.index}
                                className={`flex items-center justify-between gap-3 rounded px-1 ${
                                    isActive ? 'bg-amber-100' : ''
                                }`}
                            >
                                <span className="text-slate-700">
                                    {instruction.text}
                                </span>
                                <span className="text-slate-400">
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
        </section>
    );
}
