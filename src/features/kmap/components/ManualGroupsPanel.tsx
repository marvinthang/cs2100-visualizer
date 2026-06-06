import type { KMapGroup } from '../../../core/kmap/kmapModel';

const groupMarkerClasses = [
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-lime-500',
];

type ManualGroupsPanelProps = {
    groups: KMapGroup[];
    activeGroupId: number | null;
    groupView: 'manual' | 'solver';
    onClearGroups: () => void;
    onRemoveGroup: (groupId: number) => void;
    onSelectGroup: (groupId: number | null) => void;
    onGroupViewChange: (view: 'manual' | 'solver') => void;
};

export default function ManualGroupsPanel({
    groups,
    activeGroupId,
    groupView,
    onClearGroups,
    onRemoveGroup,
    onSelectGroup,
    onGroupViewChange,
}: ManualGroupsPanelProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    Manual Groups
                </h2>
                {groups.length > 0 && (
                    <button
                        type="button"
                        onClick={onClearGroups}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                        Clear
                    </button>
                )}
            </div>

            {groups.length === 0 ? (
                <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-400">
                    No groups yet.
                </div>
            ) : (
                <ul className="space-y-2">
                    {groups.map((group, index) => {
                        const isActive =
                            groupView === 'manual' &&
                            activeGroupId === group.id;

                        return (
                            <li
                                key={group.id}
                                className={`rounded-lg border bg-slate-50 p-3 transition ${
                                    isActive
                                        ? 'border-blue-400 ring-2 ring-blue-200'
                                        : 'border-slate-200'
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
                                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                    >
                                        Remove
                                    </button>
                                </div>
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
