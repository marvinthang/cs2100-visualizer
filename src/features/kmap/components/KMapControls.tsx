import { useState, type ReactNode } from 'react';
import type { VariableCount } from '../../../core/kmap/kmapModel';
import type { KMapPracticeDifficulty } from '../../../core/kmap/kmapPracticeGenerator';
import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';
import {
    compactInputClass,
    compactMonoInputClass,
    compactPrimaryButtonClass,
    compactSecondaryButtonClass,
} from './kmapUiClasses';

const modeOptions: Array<{ value: 'edit' | 'group'; label: string }> = [
    { value: 'edit', label: 'Edit' },
    { value: 'group', label: 'Group' },
];

const formOptions: Array<{
    value: KMapSolveForm;
    label: string;
}> = [
    { value: 'SOP', label: 'SOP' },
    { value: 'POS', label: 'POS' },
];

const practiceDifficultyOptions: Array<{
    value: KMapPracticeDifficulty;
    label: string;
}> = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

// Small "?" bubble that reveals an explanation on hover or click.
function InfoDot({ text }: { text: string }) {
    const [open, setOpen] = useState(false);
    return (
        <span className="relative inline-flex">
            <button
                type="button"
                aria-label="More info"
                onClick={() => setOpen((prev) => !prev)}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
                i
            </button>
            {open && (
                <span className="absolute left-5 top-0 z-50 w-56 whitespace-normal rounded-md border border-slate-200 bg-white p-2 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-slate-600 shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {text}
                </span>
            )}
        </span>
    );
}

// Small uppercase caption with an info bubble, used to label a control group.
function FieldLabel({ label, info }: { label: string; info: string }) {
    return (
        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
            {label}
            <InfoDot text={info} />
        </div>
    );
}

function ControlSection({
    title,
    meta,
    children,
}: {
    title: string;
    meta?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {title}
                </h3>
                {meta}
            </div>
            {children}
        </div>
    );
}

type KMapControlsProps = {
    mode: 'edit' | 'group';
    solverForm: KMapSolveForm;
    variableCount: VariableCount;
    variableNameInput: string;
    variableNameError: string | null;
    mintermInput: string;
    dontCareInput: string;
    valueInputError: string | null;
    booleanExpressionInput: string;
    booleanExpressionError: string | null;
    groupTargetValue: 0 | 1;
    practiceDifficulty: KMapPracticeDifficulty;
    onModeChange: (mode: 'edit' | 'group') => void;
    onSolverFormChange: (form: KMapSolveForm) => void;
    onVariableCountChange: (variableCount: VariableCount) => void;
    onVariableNameInputChange: (value: string) => void;
    onMintermInputChange: (value: string) => void;
    onDontCareInputChange: (value: string) => void;
    onApplyValueInputs: () => void;
    onClearMapValues: () => void;
    onBooleanExpressionInputChange: (value: string) => void;
    onApplyBooleanExpression: () => void;
    onPracticeDifficultyChange: (difficulty: KMapPracticeDifficulty) => void;
    onGeneratePracticeMap: () => void;
};

export default function KMapControls({
    mode,
    solverForm,
    variableCount,
    variableNameInput,
    variableNameError,
    mintermInput,
    dontCareInput,
    valueInputError,
    booleanExpressionInput,
    booleanExpressionError,
    groupTargetValue,
    practiceDifficulty,
    onModeChange,
    onSolverFormChange,
    onVariableCountChange,
    onVariableNameInputChange,
    onMintermInputChange,
    onDontCareInputChange,
    onApplyValueInputs,
    onClearMapValues,
    onBooleanExpressionInputChange,
    onApplyBooleanExpression,
    onPracticeDifficultyChange,
    onGeneratePracticeMap,
}: KMapControlsProps) {
    return (
        <section className="h-fit rounded-lg border border-slate-300 bg-[#fbfcfd] shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
                <div>
                    <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        Controls
                    </h2>
                </div>
                <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                    {solverForm}
                </span>
            </div>

            <div className="space-y-3 p-3">
                <ControlSection
                    title="Expression"
                    meta={
                        <span className="font-mono text-[10px] font-semibold text-emerald-700">
                            target {groupTargetValue}/X
                        </span>
                    }
                >
                    <FieldLabel
                        label="Form"
                        info="SOP (sum of products) builds the expression from the 1-cells — groups of 1s OR'd together. POS (product of sums) builds it from the 0-cells — groups of 0s, written as factors AND'd together."
                    />
                    <div className="grid grid-cols-2 gap-2">
                        {formOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onSolverFormChange(option.value)}
                                className={`rounded-md border px-3 py-1.5 text-center transition ${
                                    solverForm === option.value
                                        ? 'border-sky-400 bg-sky-50 shadow-sm ring-2 ring-sky-100 dark:border-sky-500 dark:bg-sky-950'
                                        : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-2">
                        <FieldLabel
                            label="Mode"
                            info="Edit: click a cell to cycle its value 0 → 1 → X (don't-care). Group: click cells one by one, or drag a rectangle over the 1/X cells, to select a valid group, then Add it."
                        />
                    </div>
                    <div className="mt-1 grid grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
                        {modeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onModeChange(option.value)}
                                className={`rounded px-3 py-1 text-xs font-semibold transition ${
                                    mode === option.value
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </ControlSection>

                <ControlSection
                    title="Setup"
                    meta={
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {variableCount} vars
                        </span>
                    }
                >
                    <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                Variables
                            </span>
                            <select
                                value={variableCount}
                                onChange={(event) =>
                                    onVariableCountChange(
                                        Number(
                                            event.target.value,
                                        ) as VariableCount,
                                    )
                                }
                                className={compactInputClass}
                            >
                                <option value={2}>2 variables</option>
                                <option value={3}>3 variables</option>
                                <option value={4}>4 variables</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                Names
                            </span>
                            <input
                                type="text"
                                value={variableNameInput}
                                onChange={(event) =>
                                    onVariableNameInputChange(
                                        event.target.value,
                                    )
                                }
                                placeholder="A B C"
                                className={compactMonoInputClass}
                            />
                        </label>
                    </div>

                    {variableNameError !== null && (
                        <p className="mt-2 text-xs text-amber-600">
                            {variableNameError}
                        </p>
                    )}
                </ControlSection>

                <ControlSection title="Boolean Expression">
                    <div className="flex gap-2">
                        <label className="min-w-0 flex-1">
                            <input
                                type="text"
                                value={booleanExpressionInput}
                                onChange={(event) =>
                                    onBooleanExpressionInputChange(
                                        event.target.value,
                                    )
                                }
                                placeholder="A'B + C.D"
                                className={compactMonoInputClass}
                            />
                        </label>

                        <button
                            type="button"
                            onClick={onApplyBooleanExpression}
                            className={compactPrimaryButtonClass}
                        >
                            Apply
                        </button>
                    </div>

                    {booleanExpressionError !== null && (
                        <p className="mt-2 text-xs text-red-600">
                            {booleanExpressionError}
                        </p>
                    )}
                </ControlSection>

                <ControlSection title="Function Values">
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                    1 cells
                                </span>
                                <input
                                    type="text"
                                    value={mintermInput}
                                    onChange={(event) =>
                                        onMintermInputChange(event.target.value)
                                    }
                                    placeholder="1,2"
                                    className={compactMonoInputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                    X cells
                                </span>
                                <input
                                    type="text"
                                    value={dontCareInput}
                                    onChange={(event) =>
                                        onDontCareInputChange(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="4,5"
                                    className={compactMonoInputClass}
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={onApplyValueInputs}
                                className={compactPrimaryButtonClass}
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={onClearMapValues}
                                className={compactSecondaryButtonClass}
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {valueInputError !== null && (
                        <p className="mt-2 text-xs text-red-600">
                            {valueInputError}
                        </p>
                    )}
                </ControlSection>

                <ControlSection title="Practice">
                    <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
                        {practiceDifficultyOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    onPracticeDifficultyChange(option.value)
                                }
                                className={`min-w-0 truncate rounded px-1 py-1 text-center text-xs font-semibold transition ${
                                    practiceDifficulty === option.value
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onGeneratePracticeMap}
                        className={`${compactPrimaryButtonClass} mt-2 w-full`}
                    >
                        Generate
                    </button>
                </ControlSection>
            </div>
        </section>
    );
}
