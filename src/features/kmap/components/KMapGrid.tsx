import { useRef, useState, type CSSProperties } from 'react';
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
        return 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100';
    }

    if (value === 'X') {
        return 'bg-amber-50 text-amber-800 hover:bg-amber-100';
    }

    return 'bg-white text-slate-500 hover:bg-slate-50';
}

function getValueBadgeClass(value: KMapCellValue): string {
    if (value === 1) {
        return 'text-emerald-800';
    }

    if (value === 'X') {
        return 'text-amber-800';
    }

    return 'text-slate-500';
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
    const paletteSize = groupOutlineColors.length;
    const color = groupOutlineColors[colorIndex % paletteSize];
    const stackOffset = 4 + (colorIndex % paletteSize) * 4;

    return {
        inset: `${stackOffset}px`,
        color,
        borderTopColor: hasTopNeighbor ? 'transparent' : color,
        borderRightColor: hasRightNeighbor ? 'transparent' : color,
        borderBottomColor: hasBottomNeighbor ? 'transparent' : color,
        borderLeftColor: hasLeftNeighbor ? 'transparent' : color,
        opacity: isDimmed ? 0.2 : 1,
        filter: isHoveredGroup ? `drop-shadow(0 0 5px ${color})` : 'none',
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
    dragEnabled = false,
    onSelectRegion,
    onDragEnd,
}: {
    model: KMapModel;
    variableNames: string[];
    selectedMinterms: number[];
    groups: KMapGroup[];
    activeGroupId: number | null;
    onCellClick: (minterm: number) => void;
    // group-mode drag selection: drag a rectangle of cells into one selection
    dragEnabled?: boolean;
    onSelectRegion?: (minterms: number[]) => void;
    onDragEnd?: () => void;
}) {
    const rows = getKMap2DArray(model);
    // drag state kept in refs so mouse-move does not thrash re-renders
    const dragStart = useRef<{ row: number; col: number } | null>(null);
    const dragged = useRef(false);
    const justDragged = useRef(false);
    // selection at the moment a drag starts, so the dragged rectangle is added
    // to it (never wipes the cells that were already selected)
    const baseSelection = useRef<number[]>([]);

    // every minterm inside the rectangle spanned by two cells (no wrap-around)
    function rectangleMinterms(
        a: { row: number; col: number },
        b: { row: number; col: number },
    ): number[] {
        const rowMin = Math.min(a.row, b.row);
        const rowMax = Math.max(a.row, b.row);
        const colMin = Math.min(a.col, b.col);
        const colMax = Math.max(a.col, b.col);
        const minterms: number[] = [];
        for (let row = rowMin; row <= rowMax; row++) {
            for (let col = colMin; col <= colMax; col++) {
                minterms.push(rows[row][col].minterm);
            }
        }
        return minterms;
    }
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
        <div className="overflow-auto bg-[#f7f9fa] px-3 py-5">
            <div
                className="mx-auto grid w-fit gap-0 font-mono text-sm"
                style={{
                    gridTemplateColumns: `2.75rem 3.75rem repeat(${colCount}, minmax(4.5rem, 5rem)) 2.75rem`,
                    gridTemplateRows: `2.25rem 2.75rem repeat(${rowCount}, minmax(4.5rem, 5rem)) 2.25rem`,
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
                    className="relative flex h-full w-full flex-col justify-center border border-slate-950 bg-slate-950 px-2 text-[10px] font-semibold text-white"
                    style={{ gridColumn: 2, gridRow: 2 }}
                >
                    <span className="block text-right">{colVariableLabel}</span>
                    <span className="block text-left">{rowVariableLabel}</span>
                    <span className="absolute left-2 top-1 h-12 w-px origin-top -rotate-45 bg-white/60" />
                </div>

                {model.colLabels.map((label, colIndex) => (
                    <div
                        key={label}
                        className="flex h-full w-full flex-col items-center justify-center border border-l-0 border-slate-300 bg-slate-100 text-xs font-semibold text-slate-700"
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
                        className="flex h-full w-full flex-col items-center justify-center border border-t-0 border-slate-300 bg-slate-100 text-xs font-semibold text-slate-700"
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
                            .map((candidateGroup, index) =>
                                candidateGroup.minterms.includes(cell.minterm)
                                    ? {
                                          id: candidateGroup.id,
                                          group: candidateGroup,
                                          colorIndex:
                                              candidateGroup.colorIndex ??
                                              index,
                                      }
                                    : null,
                            )
                            .filter((cellGroup) => cellGroup !== null);
                        const valueClass = getCellValueClass(cell.value);
                        const valueBadgeClass = getValueBadgeClass(cell.value);
                        const visibleCellGroups = cellGroups.slice(0, 3);
                        const hiddenGroupCount =
                            cellGroups.length - visibleCellGroups.length;
                        const hasEmphasizedGroup = cellGroups.some(
                            (cellGroup) =>
                                hoveredMinterm !== null
                                    ? hoveredGroupIds.has(cellGroup.id)
                                    : activeGroupId === cellGroup.id,
                        );
                        const cellLayerClass = hasEmphasizedGroup
                            ? 'z-30'
                            : cellGroups.length > 0
                              ? 'z-20'
                              : 'z-0';

                        return (
                            <button
                                key={cell.minterm}
                                type="button"
                                onClick={() => {
                                    // a drag just finished on this cell: swallow
                                    // the click so it does not toggle the cell
                                    if (justDragged.current) {
                                        justDragged.current = false;
                                        return;
                                    }
                                    onCellClick(cell.minterm);
                                }}
                                onMouseDown={(event) => {
                                    if (!dragEnabled) {
                                        return;
                                    }
                                    event.preventDefault();
                                    dragStart.current = {
                                        row: cell.row,
                                        col: cell.col,
                                    };
                                    dragged.current = false;
                                    // start of a fresh interaction: a prior
                                    // multi-cell drag fires no click to clear
                                    // this, so reset it here or the next real
                                    // click would be swallowed
                                    justDragged.current = false;
                                    // remember what was already selected so the
                                    // dragged rectangle adds to it
                                    baseSelection.current = selectedMinterms;
                                    // no hover emphasis while dragging so the
                                    // existing groups stay fully visible
                                    setHoveredMinterm(null);
                                }}
                                onMouseEnter={() => {
                                    if (
                                        dragEnabled &&
                                        dragStart.current &&
                                        onSelectRegion
                                    ) {
                                        dragged.current = true;
                                        const rectangle = rectangleMinterms(
                                            dragStart.current,
                                            { row: cell.row, col: cell.col },
                                        );
                                        onSelectRegion([
                                            ...new Set([
                                                ...baseSelection.current,
                                                ...rectangle,
                                            ]),
                                        ]);
                                        return;
                                    }
                                    setHoveredMinterm(cell.minterm);
                                }}
                                onMouseUp={() => {
                                    if (!dragEnabled || !dragStart.current) {
                                        return;
                                    }
                                    if (dragged.current) {
                                        justDragged.current = true;
                                        // drop the parked hover so existing
                                        // groups are not dimmed after the drag
                                        setHoveredMinterm(null);
                                        onDragEnd?.();
                                    }
                                    dragStart.current = null;
                                    dragged.current = false;
                                }}
                                onMouseLeave={() => setHoveredMinterm(null)}
                                onFocus={() => setHoveredMinterm(cell.minterm)}
                                onBlur={() => setHoveredMinterm(null)}
                                className={`relative isolate flex h-full w-full flex-col items-center justify-center border border-l-0 border-t-0 border-slate-300 transition ${cellLayerClass} ${
                                    valueClass
                                } ${
                                    isSelected
                                        ? 'ring-2 ring-slate-950 ring-inset'
                                        : ''
                                }`}
                                style={{
                                    gridColumn: 3 + cell.col,
                                    gridRow: 3 + cell.row,
                                }}
                            >
                                {cellGroups.map((cellGroup) => {
                                    const isHoveredGroup = hoveredGroupIds.has(
                                        cellGroup.id,
                                    );
                                    const isActiveGroup =
                                        activeGroupId === cellGroup.id;
                                    const isEmphasizedGroup =
                                        hoveredMinterm !== null
                                            ? isHoveredGroup
                                            : isActiveGroup;

                                    return (
                                        <span
                                            key={cellGroup.id}
                                            className={`pointer-events-none absolute rounded-xl border-transparent transition ${
                                                isEmphasizedGroup
                                                    ? 'z-40 border-[4px]'
                                                    : 'z-30 border-[3px]'
                                            }`}
                                            style={getGroupOutlineStyle({
                                                cell,
                                                group: cellGroup.group,
                                                rows,
                                                colorIndex:
                                                    cellGroup.colorIndex,
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
                                    <span className="absolute bottom-1 right-1 z-30 flex items-center gap-1 rounded bg-white/90 px-1 py-0.5 ring-1 ring-slate-200/80">
                                        {visibleCellGroups.map((cellGroup) => (
                                            <span
                                                key={cellGroup.id}
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    groupDotColors[
                                                        cellGroup.colorIndex %
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
                                    className={`relative z-0 text-2xl font-bold ${valueBadgeClass}`}
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
