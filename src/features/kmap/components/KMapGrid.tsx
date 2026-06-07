import type { CSSProperties } from 'react';
import type {
    KMapCell,
    KMapGroup,
    KMapModel,
} from '../../../core/kmap/kmapModel';
import type { KMapCellValue } from '../../../core/kmap/kmapModel';
import { getKMap2DArray } from '../../../core/kmap/kmapModel';

const groupOutlineColors = [
    '#10b981',
    '#f59e0b',
    '#f43f5e',
    '#8b5cf6',
    '#06b6d4',
    '#84cc16',
];

const groupDotColors = [
    'bg-emerald-600 ring-2 ring-white',
    'bg-amber-600 ring-2 ring-white',
    'bg-rose-600 ring-2 ring-white',
    'bg-violet-600 ring-2 ring-white',
    'bg-cyan-600 ring-2 ring-white',
    'bg-lime-600 ring-2 ring-white',
];

function getCellValueClass(value: KMapCellValue): string {
    if (value === 1) {
        return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
    }

    if (value === 'X') {
        return 'bg-amber-50 text-amber-700 hover:bg-amber-100';
    }

    return 'bg-slate-50 text-slate-500 hover:bg-slate-100';
}

function getValueBadgeClass(value: KMapCellValue): string {
    if (value === 1) {
        return 'bg-emerald-100 text-emerald-800';
    }

    if (value === 'X') {
        return 'bg-amber-100 text-amber-800';
    }

    return 'bg-slate-200 text-slate-600';
}

function getGroupOutlineStyle({
    cell,
    group,
    rows,
    colorIndex,
}: {
    cell: KMapCell;
    group: KMapGroup;
    rows: KMapCell[][];
    colorIndex: number;
}): CSSProperties {
    const rowCount = rows.length;
    const colCount = rows[0]?.length ?? 0;
    const mintermSet = new Set(group.minterms);
    // check if the whole row is covered
    const hasFullRow = Array.from({ length: colCount }, (_, col) => rows[cell.row][col].minterm).every((minterm) => mintermSet.has(minterm));

    const hasFullCol = Array.from({ length: rowCount }, (_, row) => rows[row][cell.col].minterm).every((minterm) => mintermSet.has(minterm));

    const hasTopNeighbor = !(
        (hasFullCol && cell.row == 0) ||
        !mintermSet.has(rows[(cell.row - 1 + rowCount) % rowCount][cell.col].minterm)
    )
    const hasRightNeighbor = !(
        (hasFullRow && cell.col == colCount - 1) ||
        !mintermSet.has(rows[cell.row][(cell.col + 1) % colCount].minterm)
    );
    const hasBottomNeighbor = !(
        (hasFullCol && cell.row == rowCount - 1) ||
        !mintermSet.has(rows[(cell.row + 1) % rowCount][cell.col].minterm)
    )
    const hasLeftNeighbor = !(
        (hasFullRow && cell.col == 0) ||
        !mintermSet.has(rows[cell.row][(cell.col - 1 + colCount) % colCount].minterm)
    )
    const color = groupOutlineColors[colorIndex % groupOutlineColors.length];
    const stackOffset = -5 + (colorIndex % 6) * 3;

    return {
        inset: `${stackOffset}px`,
        borderTopColor: hasTopNeighbor ? 'transparent' : color,
        borderRightColor: hasRightNeighbor ? 'transparent' : color,
        borderBottomColor: hasBottomNeighbor ? 'transparent' : color,
        borderLeftColor: hasLeftNeighbor ? 'transparent' : color,
    };
}

export default function KMapGrid({
    model,
    variableNames,
    selectedMinterms,
    groups,
    activeGroupId,
    onCellClick,
}: {
    model: KMapModel;
    variableNames: string[];
    selectedMinterms: number[];
    groups: KMapGroup[];
    activeGroupId: number | null;
    onCellClick: (minterm: number) => void;
}) {
    const rows = getKMap2DArray(model);
    const rowBitCount = model.rowLabels[0].length;
    const rowVariableLabel = variableNames.slice(0, rowBitCount).join('');
    const colVariableLabel = variableNames.slice(rowBitCount).join('');
    const activeGroup = groups.find((group) => group.id === activeGroupId);

    return (
        <div className="overflow-auto">
            <table className="mx-auto border-separate border-spacing-1 font-mono text-sm">
                <thead>
                    <tr>
                        <th className="h-10 w-14 rounded-md bg-slate-900 px-2 text-[10px] font-semibold text-white">
                            <span className="block text-right">
                                {colVariableLabel}
                            </span>
                            <span className="block text-left">
                                {rowVariableLabel}
                            </span>
                        </th>
                        {model.colLabels.map((label) => (
                            <th
                                key={label}
                                className="h-10 w-16 rounded-md bg-slate-100 text-xs font-semibold text-slate-600"
                            >
                                <span className="block text-[10px] text-slate-400">
                                    {colVariableLabel}
                                </span>
                                <span>{label}</span>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={model.rowLabels[rowIndex]}>
                            <th className="h-16 w-14 rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                                <span className="block text-[10px] text-slate-400">
                                    {rowVariableLabel}
                                </span>
                                <span>{model.rowLabels[rowIndex]}</span>
                            </th>

                            {row.map((cell) => {
                                const isSelected = selectedMinterms.includes(
                                    cell.minterm,
                                );
                                const cellGroups = groups
                                    .map((group, index) =>
                                        group.minterms.includes(cell.minterm)
                                            ? {
                                                  id: group.id,
                                                  group,
                                                  colorIndex:
                                                      group.colorIndex ?? index,
                                              }
                                            : null,
                                    )
                                    .filter((group) => group !== null);
                                const isActiveGroupCell =
                                    activeGroup?.minterms.includes(
                                        cell.minterm,
                                    ) ?? false;
                                const valueClass = getCellValueClass(
                                    cell.value,
                                );
                                const valueBadgeClass = getValueBadgeClass(
                                    cell.value,
                                );
                                const visibleCellGroups = cellGroups.slice(
                                    0,
                                    3,
                                );
                                const hiddenGroupCount =
                                    cellGroups.length -
                                    visibleCellGroups.length;
                                return (
                                    <td key={cell.minterm}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onCellClick(cell.minterm)
                                            }
                                            className={`relative isolate flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 border-slate-200 transition ${
                                                valueClass
                                            } ${
                                                isSelected
                                                    ? 'bg-blue-100 ring-2 ring-blue-500'
                                                    : ''
                                            } ${
                                                isActiveGroupCell
                                                    ? 'z-10 ring-4 ring-blue-400 ring-offset-2'
                                                    : ''
                                            }`}
                                        >
                                            {cellGroups.map((group) => (
                                                <span
                                                    key={group.id}
                                                    className="pointer-events-none absolute z-20 rounded-xl border-[3px] border-transparent"
                                                    style={getGroupOutlineStyle(
                                                        {
                                                            cell,
                                                            group: group.group,
                                                            rows,
                                                            colorIndex:
                                                                group.colorIndex,
                                                        },
                                                    )}
                                                />
                                            ))}
                                            {cellGroups.length > 0 && (
                                                <span className="absolute right-1 top-1 z-30 flex items-center gap-1 rounded-full bg-white/85 px-1 py-0.5 shadow-sm">
                                                    {visibleCellGroups.map(
                                                        (group) => (
                                                            <span
                                                                key={group.id}
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    groupDotColors[
                                                                        group.colorIndex %
                                                                            groupDotColors.length
                                                                    ]
                                                                }`}
                                                            />
                                                        ),
                                                    )}
                                                    {hiddenGroupCount > 0 && (
                                                        <span className="rounded bg-slate-800 px-1 text-[9px] font-semibold leading-3 text-white">
                                                            +{hiddenGroupCount}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                                <span
                                                    className={`relative z-0 rounded px-2 py-0.5 text-lg font-bold ${valueBadgeClass}`}
                                                >
                                                    {cell.value}
                                                </span>
                                                <span className="relative z-0 mt-1 text-[10px] text-slate-400">
                                                    m{cell.minterm}
                                                </span>
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
