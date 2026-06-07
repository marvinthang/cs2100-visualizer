import { useState, type CSSProperties } from 'react';
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

type AxisBrace = {
    label: string;
    startIndex: number;
    endIndex: number;
    side: 'top' | 'right' | 'bottom' | 'left';
};

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
    isHoveredGroup,
    isDimmed,
}: {
    cell: KMapCell;
    group: KMapGroup;
    rows: KMapCell[][];
    colorIndex: number;
    isHoveredGroup: boolean;
    isDimmed: boolean;
}): CSSProperties {
    const rowCount = rows.length;
    const colCount = rows[0]?.length ?? 0;
    const mintermSet = new Set(group.minterms);
    const hasFullRow = Array.from(
        { length: colCount },
        (_, col) => rows[cell.row][col].minterm,
    ).every((minterm) => mintermSet.has(minterm));
    const hasFullCol = Array.from(
        { length: rowCount },
        (_, row) => rows[row][cell.col].minterm,
    ).every((minterm) => mintermSet.has(minterm));
    const hasTopNeighbor = !(
        (hasFullCol && cell.row === 0) ||
        !mintermSet.has(
            rows[(cell.row - 1 + rowCount) % rowCount][cell.col].minterm,
        )
    );
    const hasRightNeighbor = !(
        (hasFullRow && cell.col === colCount - 1) ||
        !mintermSet.has(rows[cell.row][(cell.col + 1) % colCount].minterm)
    );
    const hasBottomNeighbor = !(
        (hasFullCol && cell.row === rowCount - 1) ||
        !mintermSet.has(rows[(cell.row + 1) % rowCount][cell.col].minterm)
    );
    const hasLeftNeighbor = !(
        (hasFullRow && cell.col === 0) ||
        !mintermSet.has(
            rows[cell.row][(cell.col - 1 + colCount) % colCount].minterm,
        )
    );
    const color = groupOutlineColors[colorIndex % groupOutlineColors.length];
    const stackOffset = -5 + (colorIndex % 6) * 3;

    return {
        inset: `${stackOffset}px`,
        borderTopColor: hasTopNeighbor ? 'transparent' : color,
        borderRightColor: hasRightNeighbor ? 'transparent' : color,
        borderBottomColor: hasBottomNeighbor ? 'transparent' : color,
        borderLeftColor: hasLeftNeighbor ? 'transparent' : color,
        opacity: isDimmed ? 0.2 : 1,
        filter: isHoveredGroup ? 'drop-shadow(0 0 4px currentColor)' : 'none',
    };
}

function getOneSpan(labels: string[], bitIndex: number) {
    const matchingIndexes = labels
        .map((label, index) => (label[bitIndex] === '1' ? index : -1))
        .filter((index) => index !== -1);

    if (matchingIndexes.length === 0) {
        return null;
    }

    return {
        startIndex: Math.min(...matchingIndexes),
        endIndex: Math.max(...matchingIndexes),
    };
}

function getColumnBraces(
    labels: string[],
    variableNames: string[],
): AxisBrace[] {
    return variableNames
        .map((label, bitIndex) => {
            const span = getOneSpan(labels, bitIndex);

            if (span === null) {
                return null;
            }

            return {
                label,
                startIndex: span.startIndex,
                endIndex: span.endIndex,
                side: bitIndex % 2 === 0 ? 'top' : 'bottom',
            } satisfies AxisBrace;
        })
        .filter((brace) => brace !== null);
}

function getRowBraces(labels: string[], variableNames: string[]): AxisBrace[] {
    return variableNames
        .map((label, bitIndex) => {
            const span = getOneSpan(labels, bitIndex);

            if (span === null) {
                return null;
            }

            return {
                label,
                startIndex: span.startIndex,
                endIndex: span.endIndex,
                side: bitIndex % 2 === 0 ? 'left' : 'right',
            } satisfies AxisBrace;
        })
        .filter((brace) => brace !== null);
}

function HorizontalAxisBrace({
    brace,
    gridRow,
}: {
    brace: AxisBrace;
    gridRow: number;
}) {
    const isTop = brace.side === 'top';

    return (
        <div
            className="pointer-events-none relative h-8 font-sans text-slate-900"
            style={{
                gridColumn: `${3 + brace.startIndex} / span ${
                    brace.endIndex - brace.startIndex + 1
                }`,
                gridRow,
            }}
        >
            <span
                className={`absolute left-1/2 -translate-x-1/2 text-sm font-bold ${
                    isTop ? 'top-0' : 'bottom-0'
                }`}
            >
                {brace.label}
            </span>
            <span
                className={`absolute left-1 right-1 h-3 ${
                    isTop
                        ? 'bottom-0 rounded-t-xl border-l-2 border-r-2 border-t-2'
                        : 'top-0 rounded-b-xl border-b-2 border-l-2 border-r-2'
                } border-slate-900`}
            />
        </div>
    );
}

function VerticalAxisBrace({
    brace,
    colCount,
}: {
    brace: AxisBrace;
    colCount: number;
}) {
    const isLeft = brace.side === 'left';

    return (
        <div
            className="pointer-events-none relative h-full w-10 font-sans text-slate-900"
            style={{
                gridColumn: isLeft ? 1 : 3 + colCount,
                gridRow: `${3 + brace.startIndex} / span ${
                    brace.endIndex - brace.startIndex + 1
                }`,
            }}
        >
            <span
                className={`absolute top-1/2 -translate-y-1/2 text-sm font-bold ${
                    isLeft ? 'left-0' : 'right-0'
                }`}
            >
                {brace.label}
            </span>
            <span
                className={`absolute bottom-1 top-1 w-3 ${
                    isLeft
                        ? 'right-0 rounded-l-xl border-b-2 border-l-2 border-t-2'
                        : 'left-0 rounded-r-xl border-b-2 border-r-2 border-t-2'
                } border-slate-900`}
            />
        </div>
    );
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
    const rowCount = model.rowLabels.length;
    const colCount = model.colLabels.length;
    const rowBitCount = model.rowLabels[0].length;
    const rowVariableNames = variableNames.slice(0, rowBitCount);
    const colVariableNames = variableNames.slice(rowBitCount);
    const rowVariableLabel = rowVariableNames.join('');
    const colVariableLabel = colVariableNames.join('');
    const colBraces = getColumnBraces(model.colLabels, colVariableNames);
    const rowBraces = getRowBraces(model.rowLabels, rowVariableNames);
    const [hoveredMinterm, setHoveredMinterm] = useState<number | null>(null);
    const hoveredGroupIds = new Set(
        hoveredMinterm === null
            ? []
            : groups
                  .filter((group) => group.minterms.includes(hoveredMinterm))
                  .map((group) => group.id),
    );
    const hasGroupEmphasis = hoveredMinterm !== null || activeGroupId !== null;

    return (
        <div className="overflow-auto py-2">
            <div
                className="mx-auto grid w-fit gap-1 font-mono text-sm"
                style={{
                    gridTemplateColumns: `2.5rem 3.5rem repeat(${colCount}, 4rem) 2.5rem`,
                    gridTemplateRows: `2rem 2.5rem repeat(${rowCount}, 4rem) 2rem`,
                }}
            >
                {colBraces.map((brace) => (
                    <HorizontalAxisBrace
                        key={`${brace.side}-${brace.label}`}
                        brace={brace}
                        gridRow={brace.side === 'top' ? 1 : 3 + rowCount}
                    />
                ))}

                {rowBraces.map((brace) => (
                    <VerticalAxisBrace
                        key={`${brace.side}-${brace.label}`}
                        brace={brace}
                        colCount={colCount}
                    />
                ))}

                <div
                    className="relative flex h-full w-full flex-col justify-center rounded-md bg-slate-900 px-2 text-[10px] font-semibold text-white"
                    style={{ gridColumn: 2, gridRow: 2 }}
                >
                    <span className="block text-right">{colVariableLabel}</span>
                    <span className="block text-left">{rowVariableLabel}</span>
                    <span className="absolute left-2 top-1 h-12 w-px origin-top -rotate-45 bg-white/60" />
                </div>

                {model.colLabels.map((label, colIndex) => (
                    <div
                        key={label}
                        className="flex h-full w-full flex-col items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600"
                        style={{ gridColumn: 3 + colIndex, gridRow: 2 }}
                    >
                        <span className="text-[10px] text-slate-400">
                            {colVariableLabel}
                        </span>
                        <span>{label}</span>
                    </div>
                ))}

                {model.rowLabels.map((label, rowIndex) => (
                    <div
                        key={label}
                        className="flex h-full w-full flex-col items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600"
                        style={{ gridColumn: 2, gridRow: 3 + rowIndex }}
                    >
                        <span className="text-[10px] text-slate-400">
                            {rowVariableLabel}
                        </span>
                        <span>{label}</span>
                    </div>
                ))}

                {rows.flatMap((row) =>
                    row.map((cell) => {
                        const isSelected = selectedMinterms.includes(
                            cell.minterm,
                        );
                        const cellGroups = groups
                            .map((group, index) =>
                                group.minterms.includes(cell.minterm)
                                    ? {
                                          id: group.id,
                                          group,
                                          colorIndex: group.colorIndex ?? index,
                                      }
                                    : null,
                            )
                            .filter((group) => group !== null);
                        const valueClass = getCellValueClass(cell.value);
                        const valueBadgeClass = getValueBadgeClass(cell.value);
                        const visibleCellGroups = cellGroups.slice(0, 3);
                        const hiddenGroupCount =
                            cellGroups.length - visibleCellGroups.length;

                        return (
                            <button
                                key={cell.minterm}
                                type="button"
                                onClick={() => onCellClick(cell.minterm)}
                                onMouseEnter={() =>
                                    setHoveredMinterm(cell.minterm)
                                }
                                onMouseLeave={() => setHoveredMinterm(null)}
                                onFocus={() => setHoveredMinterm(cell.minterm)}
                                onBlur={() => setHoveredMinterm(null)}
                                className={`relative isolate flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-slate-200 transition ${
                                    valueClass
                                } ${
                                    isSelected
                                        ? 'bg-blue-100 ring-2 ring-blue-500'
                                        : ''
                                }`}
                                style={{
                                    gridColumn: 3 + cell.col,
                                    gridRow: 3 + cell.row,
                                }}
                            >
                                {cellGroups.map((group) => {
                                    const isHoveredGroup = hoveredGroupIds.has(
                                        group.id,
                                    );
                                    const isActiveGroup =
                                        activeGroupId === group.id;
                                    const isEmphasizedGroup =
                                        hoveredMinterm !== null
                                            ? isHoveredGroup
                                            : isActiveGroup;

                                    return (
                                        <span
                                            key={group.id}
                                            className={`pointer-events-none absolute rounded-xl border-transparent transition ${
                                                isEmphasizedGroup
                                                    ? 'z-30 border-[4px]'
                                                    : 'z-20 border-[3px]'
                                            }`}
                                            style={getGroupOutlineStyle({
                                                cell,
                                                group: group.group,
                                                rows,
                                                colorIndex: group.colorIndex,
                                                isHoveredGroup:
                                                    isEmphasizedGroup,
                                                isDimmed:
                                                    hasGroupEmphasis &&
                                                    !isEmphasizedGroup,
                                            })}
                                        />
                                    );
                                })}
                                {cellGroups.length > 0 && (
                                    <span className="absolute right-1 top-1 z-30 flex items-center gap-1 rounded-full bg-white/85 px-1 py-0.5 shadow-sm">
                                        {visibleCellGroups.map((group) => (
                                            <span
                                                key={group.id}
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    groupDotColors[
                                                        group.colorIndex %
                                                            groupDotColors.length
                                                    ]
                                                }`}
                                            />
                                        ))}
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
                        );
                    }),
                )}
            </div>
        </div>
    );
}
