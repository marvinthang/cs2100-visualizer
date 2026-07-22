import type { ReactNode } from 'react';
import type { AddressFormat, ArrayLengthMode } from '../types/memory';
import { AddressFormatControl, SegmentButton } from './SegmentedControl';

export function ArrayLayoutEditorHeader({
    title = 'Array memory layout',
    stepLabel,
    description,
    format,
    onFormatChange,
    addDisabled,
    removeDisabled,
    onAdd,
    onRemove,
}: {
    title?: string;
    stepLabel?: string;
    description: string;
    format: AddressFormat;
    onFormatChange: (format: AddressFormat) => void;
    addDisabled: boolean;
    removeDisabled: boolean;
    onAdd: () => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {stepLabel === undefined
                        ? title
                        : `${stepLabel} / ${title}`}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                    {description}
                </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <AddressFormatControl
                    value={format}
                    onChange={onFormatChange}
                />
                <div className="flex gap-1">
                    <button
                        type="button"
                        disabled={addDisabled}
                        onClick={onAdd}
                        className="h-[34px] rounded-md border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        + Add array
                    </button>
                    <button
                        type="button"
                        disabled={removeDisabled}
                        onClick={onRemove}
                        className="h-[34px] rounded-md border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        Remove last
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ArrayDefinitionCard({
    name,
    children,
}: {
    name: string;
    children: ReactNode;
}) {
    return (
        <div className="grid grid-cols-[42px_minmax(0,1fr)] overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-center border-r border-slate-200 bg-slate-100 font-mono text-xl font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {name}
            </div>
            <div className="min-w-0 p-2">{children}</div>
        </div>
    );
}

export function EmptyArrayLayout() {
    return (
        <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Add an array to define its memory layout.
        </p>
    );
}

export function ArrayPlacementControl({
    mode,
    previousName,
    onChange,
}: {
    mode: 'fixed' | 'after-previous';
    previousName: string | null;
    onChange: (mode: 'fixed' | 'after-previous') => void;
}) {
    if (previousName === null) return null;

    return (
        <div className="mb-2 grid grid-cols-2 rounded-md bg-slate-100 p-0.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-800">
            <SegmentButton
                value="fixed"
                selected={mode === 'fixed'}
                onSelect={onChange}
                size="compact"
            >
                Fixed
            </SegmentButton>
            <SegmentButton
                value="after-previous"
                selected={mode === 'after-previous'}
                onSelect={onChange}
                size="compact"
            >
                After {previousName}
            </SegmentButton>
        </div>
    );
}

export function ArrayLengthField({
    value,
    mode,
    previousName,
    onModeChange,
    onChange,
}: {
    value: string;
    mode: ArrayLengthMode;
    previousName: string | null;
    onModeChange: (mode: ArrayLengthMode) => void;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <span className="flex min-h-4 items-center justify-between gap-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Length
                </span>
                {previousName !== null && (
                    <button
                        type="button"
                        aria-pressed={mode === 'same-as-previous'}
                        onClick={() =>
                            onModeChange(
                                mode === 'same-as-previous'
                                    ? 'fixed'
                                    : 'same-as-previous',
                            )
                        }
                        className={`rounded border px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase transition ${
                            mode === 'same-as-previous'
                                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-600 dark:bg-slate-600 dark:text-white'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        Same as {previousName}
                    </button>
                )}
            </span>
            <input
                type="number"
                min="1"
                aria-label="Length"
                readOnly={mode === 'same-as-previous'}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs font-semibold outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 ${
                    mode === 'same-as-previous'
                        ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        : 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                }`}
            />
        </div>
    );
}
