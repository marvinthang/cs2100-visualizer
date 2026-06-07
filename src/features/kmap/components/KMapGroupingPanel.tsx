import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';

const monoInputClass =
    'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 shadow-sm';
const primaryButtonClass =
    'rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
const secondaryButtonClass =
    'rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100';

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

type KMapGroupingPanelProps = {
    solverForm: KMapSolveForm;
    selectedMinterms: number[];
    canSaveSelectedGroup: boolean;
    selectedValuesAreGroupable: boolean;
    selectedGroupIsAllDontCare: boolean;
    groupTargetValue: 0 | 1;
    groupLiteralInput: string;
    groupLiteralError: string | null;
    onAddGroup: () => void;
    onClearSelectedGroup: () => void;
    onResetMap: () => void;
    onGroupLiteralInputChange: (value: string) => void;
    onApplyGroupLiteral: () => void;
};

export default function KMapGroupingPanel({
    solverForm,
    selectedMinterms,
    canSaveSelectedGroup,
    selectedValuesAreGroupable,
    selectedGroupIsAllDontCare,
    groupTargetValue,
    groupLiteralInput,
    groupLiteralError,
    onAddGroup,
    onClearSelectedGroup,
    onResetMap,
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
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    Grouping
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                    {selectedMinterms.length} selected
                </span>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.75fr)]">
                <div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
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
                </div>

                <div className="space-y-2">
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">
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
                                        ? "A'B or AB'"
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

                    <div className="grid grid-cols-3 gap-2">
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

                        <button
                            type="button"
                            onClick={onResetMap}
                            className={secondaryButtonClass}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
