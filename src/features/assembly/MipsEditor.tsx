import { useMemo, useState } from 'react';
import {
    assembleMipsProgram,
    type AssembleMipsResult,
} from '../../core/mips/assembly/assembleMipsProgram';
import { encodeMipsInstructionWord } from '../../core/mips/instruction/encodeMipsInstruction';

function toHex(word: number): string {
    return `0x${(word >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

const EXAMPLE_SOURCE = `# 17 instructions supported
lui $t0, 0x1
ori $t0, $t0, 0x234
addi $t1, $zero, 5
sll $t2, $t1, 2
sub $t3, $t2, $t1`;

type MipsEditorProps = {
    onLoad: (source: string) => AssembleMipsResult;
    programLoaded: boolean;
    programIndex: number;
    programFinished: boolean;
};

export default function MipsEditor({
    onLoad,
    programLoaded,
    programIndex,
    programFinished,
}: MipsEditorProps) {
    const [source, setSource] = useState(EXAMPLE_SOURCE);

    const program = useMemo(() => assembleMipsProgram(source), [source]);
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
                className="h-64 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900"
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
                                    {toHex(
                                        encodeMipsInstructionWord(
                                            instruction.fields,
                                        ),
                                    )}
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
