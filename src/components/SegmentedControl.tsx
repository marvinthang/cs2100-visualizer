import type { ReactNode } from 'react';
import type { AddressFormat } from '../types/memory';

export function SegmentButton<T extends string>({
    value,
    selected,
    children,
    onSelect,
    size = 'default',
}: {
    value: T;
    selected: boolean;
    children: ReactNode;
    onSelect: (value: T) => void;
    size?: 'compact' | 'default';
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(value)}
            className={`min-w-0 flex-1 rounded font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 ${
                size === 'compact'
                    ? 'px-2 py-1 text-[10px]'
                    : 'px-3 py-1.5 text-xs'
            } ${
                selected
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-600 dark:text-white'
                    : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

export function AddressFormatControl({
    value,
    onChange,
    label = 'Address base',
}: {
    value: AddressFormat;
    onChange: (format: AddressFormat) => void;
    label?: string;
}) {
    return (
        <fieldset className="w-full sm:w-[180px]">
            <legend className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                {label}
            </legend>
            <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                <SegmentButton
                    value="hexadecimal"
                    selected={value === 'hexadecimal'}
                    onSelect={onChange}
                    size="compact"
                >
                    HEX
                </SegmentButton>
                <SegmentButton
                    value="decimal"
                    selected={value === 'decimal'}
                    onSelect={onChange}
                    size="compact"
                >
                    DEC
                </SegmentButton>
            </div>
        </fieldset>
    );
}
