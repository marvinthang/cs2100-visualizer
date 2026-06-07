import type { ReactNode } from 'react';
import type { VariableCount } from '../../../core/kmap/kmapModel';
import type { KMapPracticeDifficulty } from '../../../core/kmap/kmapPracticeGenerator';
import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';

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

const inputClass =
    'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100';
const monoInputClass = `${inputClass} font-mono`;
const primaryButtonClass =
    'rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
const secondaryButtonClass =
    'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50';
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
        <div className="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
            <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
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
        <section className="h-fit rounded-lg border border-slate-300 bg-[#fbfcfd] shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5">
                <div>
                    <h2 className="text-sm font-semibold text-slate-950">
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
                    <div className="grid grid-cols-2 gap-2">
                        {formOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onSolverFormChange(option.value)}
                                className={`rounded-md border px-3 py-1.5 text-center transition ${
                                    solverForm === option.value
                                        ? 'border-sky-400 bg-sky-50 shadow-sm ring-2 ring-sky-100'
                                        : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                                }`}
                            >
                                <span className="block text-sm font-semibold text-slate-900">
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-2 grid grid-cols-2 rounded-md bg-slate-100 p-1">
                        {modeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onModeChange(option.value)}
                                className={`rounded px-3 py-1 text-xs font-semibold transition ${
                                    mode === option.value
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
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
                        <span className="font-mono text-xs text-slate-500">
                            {variableCount} vars
                        </span>
                    }
                >
                    <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-slate-600">
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
                                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            >
                                <option value={2}>2 variables</option>
                                <option value={3}>3 variables</option>
                                <option value={4}>4 variables</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-slate-600">
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
                                className={monoInputClass}
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
                                className={monoInputClass}
                            />
                        </label>

                        <button
                            type="button"
                            onClick={onApplyBooleanExpression}
                            className={primaryButtonClass}
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
                                <span className="mb-1 block text-xs font-medium text-slate-600">
                                    1 cells
                                </span>
                                <input
                                    type="text"
                                    value={mintermInput}
                                    onChange={(event) =>
                                        onMintermInputChange(event.target.value)
                                    }
                                    placeholder="1,2"
                                    className={monoInputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-600">
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
                                    className={monoInputClass}
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={onApplyValueInputs}
                                className={primaryButtonClass}
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={onClearMapValues}
                                className={secondaryButtonClass}
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
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                        <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1">
                            {practiceDifficultyOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        onPracticeDifficultyChange(option.value)
                                    }
                                    className={`rounded px-2 py-1 text-xs font-semibold transition ${
                                        practiceDifficulty === option.value
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={onGeneratePracticeMap}
                            className={primaryButtonClass}
                        >
                            Generate
                        </button>
                    </div>
                </ControlSection>
            </div>
        </section>
    );
}
