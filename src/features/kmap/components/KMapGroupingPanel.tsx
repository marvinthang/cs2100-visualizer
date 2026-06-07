import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';

const monoInputClass =
    'w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100';
const primaryButtonClass =
    'rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
const secondaryButtonClass =
    'rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50';

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
        <section className="rounded-lg border border-slate-300 bg-[#fbfcfd] shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-950">
                        Grouping
                    </h2>
                    <p className="text-xs text-slate-500">
                        Select cells, then save the group.
                    </p>
                </div>
                <span className="rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                    {selectedMinterms.length} selected
                </span>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_minmax(250px,0.85fr)]">
                <div>
                    <div className="rounded-md border border-slate-300 bg-white px-3 py-2">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Selected group
                        </div>
                        <div className="min-h-5 break-words font-mono text-xs font-medium text-slate-700">
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
