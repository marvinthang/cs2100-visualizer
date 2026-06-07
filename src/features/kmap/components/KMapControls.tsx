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
    target: string;
}> = [
    { value: 'SOP', label: 'SOP', target: 'group 1 + X' },
    { value: 'POS', label: 'POS', target: 'group 0 + X' },
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
    'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm';
const monoInputClass = `${inputClass} font-mono`;
const primaryButtonClass =
    'rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
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
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
    groupTargetValue: 0 | 1;
    practiceDifficulty: KMapPracticeDifficulty;
    onModeChange: (mode: 'edit' | 'group') => void;
    onSolverFormChange: (form: KMapSolveForm) => void;
    onVariableCountChange: (variableCount: VariableCount) => void;
    onVariableNameInputChange: (value: string) => void;
    onMintermInputChange: (value: string) => void;
    onDontCareInputChange: (value: string) => void;
    onApplyValueInputs: () => void;
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
    groupTargetValue,
    practiceDifficulty,
    onModeChange,
    onSolverFormChange,
    onVariableCountChange,
    onVariableNameInputChange,
    onMintermInputChange,
    onDontCareInputChange,
    onApplyValueInputs,
    onPracticeDifficultyChange,
    onGeneratePracticeMap,
}: KMapControlsProps) {
    return (
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    Controls
                </h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    {solverForm}
                </span>
            </div>

            <div className="space-y-4">
                <ControlSection
                    title="Expression"
                    meta={
                        <span className="font-mono text-[10px] text-blue-700">
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
                                className={`rounded-lg border px-3 py-2 text-left transition ${
                                    solverForm === option.value
                                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <span className="block text-sm font-semibold text-slate-900">
                                    {option.label}
                                </span>
                                <span className="mt-0.5 block text-[10px] font-medium text-slate-500">
                                    {option.target}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-2 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                        {modeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onModeChange(option.value)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
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
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm"
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
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 font-mono text-xs text-slate-900 shadow-sm"
                            />
                        </label>
                    </div>

                    {variableNameError !== null && (
                        <p className="mt-2 text-xs text-amber-600">
                            {variableNameError}
                        </p>
                    )}
                </ControlSection>

                <ControlSection title="Function Values">
                    <div className="space-y-2">
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
                                    onDontCareInputChange(event.target.value)
                                }
                                placeholder="4,5"
                                className={monoInputClass}
                            />
                        </label>

                        <button
                            type="button"
                            onClick={onApplyValueInputs}
                            className={`${primaryButtonClass} w-full`}
                        >
                            Apply
                        </button>
                    </div>

                    {valueInputError !== null && (
                        <p className="mt-2 text-xs text-red-600">
                            {valueInputError}
                        </p>
                    )}
                </ControlSection>

                <ControlSection title="Practice">
                    <div className="space-y-2">
                        <div>
                            <span className="mb-1 block text-xs font-medium text-slate-600">
                                Difficulty
                            </span>
                            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                                {practiceDifficultyOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            onPracticeDifficultyChange(
                                                option.value,
                                            )
                                        }
                                        className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                                            practiceDifficulty === option.value
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onGeneratePracticeMap}
                            className={`${primaryButtonClass} w-full`}
                        >
                            Generate
                        </button>
                    </div>
                </ControlSection>
            </div>
        </section>
    );
}
