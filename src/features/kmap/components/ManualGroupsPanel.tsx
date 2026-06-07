import type { KMapGroup, KMapModel } from '../../../core/kmap/kmapModel';
import type { KMapSolveForm } from '../../../core/kmap/kmapSolver';
import { formatGroupExpression } from '../kmapPageUtils';

const groupMarkerClasses = [
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-lime-500',
];

type ManualGroupsPanelProps = {
    model: KMapModel;
    groups: KMapGroup[];
    activeGroupId: number | null;
    groupView: 'manual' | 'solver';
    solverForm: KMapSolveForm;
    variableNames: string[];
    onClearGroups: () => void;
    onRemoveGroup: (groupId: number) => void;
    onSelectGroup: (groupId: number | null) => void;
    onGroupViewChange: (view: 'manual' | 'solver') => void;
};

export default function ManualGroupsPanel({
    model,
    groups,
    activeGroupId,
    groupView,
    solverForm,
    variableNames,
    onClearGroups,
    onRemoveGroup,
    onSelectGroup,
    onGroupViewChange,
}: ManualGroupsPanelProps) {
    return (
        <div className="rounded-lg border border-slate-300 bg-[#fbfcfd] shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-950">
                        Manual Groups
                    </h2>
                    <p className="text-xs text-slate-500">
                        Saved groups on the grid.
                    </p>
                </div>
                {groups.length > 0 && (
                    <button
                        type="button"
                        onClick={onClearGroups}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        Clear
                    </button>
                )}
            </div>

            {groups.length === 0 ? (
                <div className="m-4 rounded-md border border-slate-300 bg-white p-4 font-mono text-sm text-slate-500">
                    No groups yet.
                </div>
            ) : (
                <ul className="space-y-2 p-4">
                    {groups.map((group, index) => {
                        const isActive =
                            groupView === 'manual' &&
                            activeGroupId === group.id;
                        const expression = formatGroupExpression(
                            model,
                            group.minterms,
                            variableNames,
                            solverForm,
                        ).replace(/^F = /, '');

                        return (
                            <li
                                key={group.id}
                                className={`rounded-md border bg-white p-3 transition ${
                                    isActive
                                        ? 'border-sky-400 ring-2 ring-sky-200'
                                        : 'border-slate-300'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onGroupViewChange('manual');
                                            onSelectGroup(
                                                isActive ? null : group.id,
                                            );
                                        }}
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                    >
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${
                                                groupMarkerClasses[
                                                    index %
                                                        groupMarkerClasses.length
                                                ]
                                            }`}
                                        />
                                        <span className="text-sm font-semibold text-slate-900">
                                            Group {index + 1}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveGroup(group.id)}
                                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <p className="mt-2 rounded-md bg-slate-950 px-2 py-1.5 font-mono text-sm font-semibold text-white">
                                    {expression}
                                </p>
                                <p className="mt-2 font-mono text-xs text-slate-600">
                                    {group.minterms
                                        .map((minterm) => `m${minterm}`)
                                        .join(', ')}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
