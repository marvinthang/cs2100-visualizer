import { useId, useMemo, useRef } from 'react';
import type { ParseError } from '../core/mips/assembly/parseAssembly';

export default function MipsSourceEditor({
    value,
    onChange,
    errors,
    heightClass = 'h-64',
    textSizeClass = 'text-xs',
    placeholder,
    ariaLabel = 'MIPS program source',
}: {
    value: string;
    onChange: (next: string) => void;
    errors: ParseError[];
    heightClass?: string;
    textSizeClass?: string;
    placeholder?: string;
    ariaLabel?: string;
}) {
    const gutterRef = useRef<HTMLDivElement>(null);
    const errorListId = useId();
    const lineNumbers = value.split('\n').map((_, index) => index + 1);
    const errorLines = useMemo(
        () => new Set(errors.map((error) => error.line)),
        [errors],
    );

    return (
        <div>
            <div
                className={`flex ${heightClass} overflow-hidden rounded-md border border-slate-300 bg-white font-mono ${textSizeClass} leading-5 shadow-sm focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100`}
            >
                <div
                    ref={gutterRef}
                    aria-hidden="true"
                    className="select-none overflow-hidden border-r border-slate-200 bg-slate-50 py-2 pl-3 pr-2 text-right text-slate-400"
                >
                    {lineNumbers.map((lineNumber) => (
                        <div
                            key={lineNumber}
                            className={
                                errorLines.has(lineNumber)
                                    ? 'bg-rose-100 font-bold text-rose-700'
                                    : undefined
                            }
                        >
                            {lineNumber}
                        </div>
                    ))}
                </div>

                <textarea
                    wrap="off"
                    spellCheck={false}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onScroll={(event) => {
                        if (gutterRef.current) {
                            gutterRef.current.scrollTop =
                                event.currentTarget.scrollTop;
                        }
                    }}
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                    aria-invalid={errors.length > 0}
                    aria-describedby={
                        errors.length > 0 ? errorListId : undefined
                    }
                    className="min-w-0 flex-1 resize-none overflow-auto whitespace-pre bg-transparent px-3 py-2 leading-5 text-slate-900 outline-none placeholder:text-slate-400"
                />
            </div>

            {errors.length > 0 && (
                <ul
                    id={errorListId}
                    aria-live="polite"
                    className="mt-2 space-y-1 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                >
                    {errors.map((error, index) => (
                        <li key={`${error.line}-${error.message}-${index}`}>
                            <span className="font-mono font-bold">
                                Line {error.line}
                            </span>{' '}
                            {error.message}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
