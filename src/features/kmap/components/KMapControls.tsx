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

function getSelectedGroupMessage({
    groupTargetValue,
    selectedGroupIsAllDontCare,
    selectedValuesAreGroupable,
}: {
    groupTargetValue: 0 | 1;
    selectedGroupIsAllDontCare: boolean;
    selectedValuesAreGroupable: boolean;
}): string {
    if (selectedGroupIsAllDontCare) {
        return `Group must include at least one ${groupTargetValue}-cell.`;
    }

    if (selectedValuesAreGroupable) {
        return 'Selection must form a rectangle. Edge wrapping is allowed.';
    }

    return `Selected cells must be ${groupTargetValue} or X.`;
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
    selectedMinterms: number[];
    canSaveSelectedGroup: boolean;
    selectedValuesAreGroupable: boolean;
    selectedGroupIsAllDontCare: boolean;
    groupTargetValue: 0 | 1;
    practiceDifficulty: KMapPracticeDifficulty;
    groupLiteralInput: string;
    groupLiteralError: string | null;
    onModeChange: (mode: 'edit' | 'group') => void;
    onSolverFormChange: (form: KMapSolveForm) => void;
    onVariableCountChange: (variableCount: VariableCount) => void;
    onVariableNameInputChange: (value: string) => void;
    onMintermInputChange: (value: string) => void;
    onDontCareInputChange: (value: string) => void;
    onApplyValueInputs: () => void;
    onPracticeDifficultyChange: (difficulty: KMapPracticeDifficulty) => void;
    onGeneratePracticeMap: () => void;
    onAddGroup: () => void;
    onClearSelectedGroup: () => void;
    onResetMap: () => void;
    onGroupLiteralInputChange: (value: string) => void;
    onApplyGroupLiteral: () => void;
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
    selectedMinterms,
    canSaveSelectedGroup,
    selectedValuesAreGroupable,
    selectedGroupIsAllDontCare,
    groupTargetValue,
    practiceDifficulty,
    groupLiteralInput,
    groupLiteralError,
    onModeChange,
    onSolverFormChange,
    onVariableCountChange,
    onVariableNameInputChange,
    onMintermInputChange,
    onDontCareInputChange,
    onApplyValueInputs,
    onPracticeDifficultyChange,
    onGeneratePracticeMap,
    onAddGroup,
    onClearSelectedGroup,
    onResetMap,
    onGroupLiteralInputChange,
    onApplyGroupLiteral,
}: KMapControlsProps) {
    const selectedGroupText =
        selectedMinterms.length === 0
            ? 'none'
            : selectedMinterms
                  .slice()
                  .sort((a, b) => a - b)
                  .map((minterm) => `m${minterm}`)
                  .join(', ');

    return (
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    Controls
                </h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    {solverForm}
                </span>
            </div>

            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Expression Form
                    </div>
                    <div className="font-mono text-[10px] text-blue-700">
                        target {groupTargetValue}/X
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {formOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onSolverFormChange(option.value)}
                            className={`rounded-lg border px-3 py-2 text-left transition ${
                                solverForm === option.value
                                    ? 'border-blue-500 bg-white shadow-sm ring-2 ring-blue-100'
                                    : 'border-blue-100 bg-blue-50 hover:bg-white'
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

                <div className="mt-3 grid grid-cols-2 rounded-lg bg-white/70 p-1 ring-1 ring-blue-100">
                    {modeOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onModeChange(option.value)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                mode === option.value
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Setup
                    </h3>
                    <span className="font-mono text-xs text-slate-500">
                        {variableCount} vars
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                            Variables
                        </span>
                        <select
                            value={variableCount}
                            onChange={(event) =>
                                onVariableCountChange(
                                    Number(event.target.value) as VariableCount,
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
                                onVariableNameInputChange(event.target.value)
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
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Function Values
                </h3>

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
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 shadow-sm"
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
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 shadow-sm"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={onApplyValueInputs}
                        className="w-full rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                    >
                        Apply
                    </button>
                </div>

                {valueInputError !== null && (
                    <p className="mt-2 text-xs text-red-600">
                        {valueInputError}
                    </p>
                )}
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Practice
                </h3>

                <div className="space-y-2">
                    <div>
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                            Difficulty
                        </span>
                        <div className="grid grid-cols-3 gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
                            {practiceDifficultyOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        onPracticeDifficultyChange(option.value)
                                    }
                                    className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                                        practiceDifficulty === option.value
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
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
                        className="w-full rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                    >
                        Generate
                    </button>
                </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Grouping
                    </h3>
                    <span className="rounded-full bg-white px-2 py-0.5 font-mono text-xs text-slate-500 ring-1 ring-slate-200">
                        {selectedMinterms.length} selected
                    </span>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Selected group
                    </div>
                    <div className="min-h-5 break-words font-mono text-xs text-slate-600">
                        {selectedGroupText}
                    </div>
                </div>

                {!canSaveSelectedGroup && selectedMinterms.length > 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                        {getSelectedGroupMessage({
                            groupTargetValue,
                            selectedGroupIsAllDontCare,
                            selectedValuesAreGroupable,
                        })}
                    </p>
                )}

                <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">
                        Select by literal
                    </span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={groupLiteralInput}
                            onChange={(event) =>
                                onGroupLiteralInputChange(event.target.value)
                            }
                            placeholder={
                                solverForm === 'SOP' ? "A'B or AB'" : "(A + B')"
                            }
                            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={onApplyGroupLiteral}
                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                        >
                            Select
                        </button>
                    </div>
                </label>

                {groupLiteralError !== null && (
                    <p className="mt-2 text-xs text-red-600">
                        {groupLiteralError}
                    </p>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={onAddGroup}
                        disabled={!canSaveSelectedGroup}
                        className="rounded-lg bg-slate-900 px-2 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Add
                    </button>

                    <button
                        type="button"
                        onClick={onClearSelectedGroup}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                    >
                        Clear
                    </button>

                    <button
                        type="button"
                        onClick={onResetMap}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </section>
    );
}
