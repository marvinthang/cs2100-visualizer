import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';
import {
    monoInputClass,
    primaryButtonClass,
    secondaryButtonClass,
} from './kmapUiClasses';

function getSelectedGroupMessage({
    groupTargetValue,
    selectedGroupIsAllDontCare,
    selectedCellsHaveValidValues,
}: {
    groupTargetValue: 0 | 1;
    selectedGroupIsAllDontCare: boolean;
    selectedCellsHaveValidValues: boolean;
}): string {
    if (selectedGroupIsAllDontCare) {
        return `Group must include at least one ${groupTargetValue}-cell.`;
    }

    if (selectedCellsHaveValidValues) {
        return 'Selection must form a rectangle. Edge wrapping is allowed.';
    }

    return `Selected cells must be ${groupTargetValue} or X.`;
}

type KMapGroupingPanelProps = {
    solverForm: KMapSolveForm;
    selectedMinterms: number[];
    canSaveSelectedGroup: boolean;
    selectedCellsHaveValidValues: boolean;
    selectedGroupIsAllDontCare: boolean;
    groupTargetValue: 0 | 1;
    groupLiteralInput: string;
    groupLiteralError: string | null;
    onAddGroup: () => void;
    onClearSelectedGroup: () => void;
    onGroupLiteralInputChange: (value: string) => void;
    onApplyGroupLiteral: () => void;
};

export default function KMapGroupingPanel({
    solverForm,
    selectedMinterms,
    canSaveSelectedGroup,
    selectedCellsHaveValidValues,
    selectedGroupIsAllDontCare,
    groupTargetValue,
    groupLiteralInput,
    groupLiteralError,
    onAddGroup,
    onClearSelectedGroup,
    onGroupLiteralInputChange,
    onApplyGroupLiteral,
}: KMapGroupingPanelProps) {
    const selectedGroupText =
        selectedMinterms.length === 0
            ? 'none'
            : selectedMinterms
                  .slice()
                  .sort((a, b) => a - b)
                  .map((minterm) => `m${minterm}`)
                  .join(', ');

    return (
        <section className="rounded-lg border border-slate-300 bg-[#fbfcfd] shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div>
                    <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        Grouping
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select cells, then save the group.
                    </p>
                </div>
                <span className="rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {selectedMinterms.length} selected
                </span>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_minmax(250px,0.85fr)]">
                <div>
                    <div className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                            Selected group
                        </div>
                        <div className="min-h-5 break-words font-mono text-xs font-medium text-slate-700 dark:text-slate-200">
                            {selectedGroupText}
                        </div>
                    </div>

                    {!canSaveSelectedGroup && selectedMinterms.length > 0 && (
                        <p className="mt-2 text-xs text-amber-600">
                            {getSelectedGroupMessage({
                                groupTargetValue,
                                selectedGroupIsAllDontCare,
                                selectedCellsHaveValidValues,
                            })}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                            Select by literal
                        </span>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={groupLiteralInput}
                                onChange={(event) =>
                                    onGroupLiteralInputChange(
                                        event.target.value,
                                    )
                                }
                                placeholder={
                                    solverForm === 'SOP'
                                        ? "A'B or A.B'"
                                        : "(A + B')"
                                }
                                className={`min-w-0 flex-1 ${monoInputClass}`}
                            />
                            <button
                                type="button"
                                onClick={onApplyGroupLiteral}
                                className={secondaryButtonClass}
                            >
                                Select
                            </button>
                        </div>
                    </label>

                    {groupLiteralError !== null && (
                        <p className="text-xs text-red-600">
                            {groupLiteralError}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={onAddGroup}
                            disabled={!canSaveSelectedGroup}
                            className={primaryButtonClass}
                        >
                            Add
                        </button>

                        <button
                            type="button"
                            onClick={onClearSelectedGroup}
                            className={secondaryButtonClass}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
