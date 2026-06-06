export type VariableCount = 2 | 3 | 4;

export type KMapCellValue = 0 | 1 | 'X';

export type KMapCell = {
    minterm: number;
    row: number;
    col: number;
    value: KMapCellValue;
};

export type KMapModel = {
    variableCount: VariableCount;
    rowLabels: string[];
    colLabels: string[];
    cells: KMapCell[];
};

export type KMapGroup = {
    id: number;
    minterms: number[];
    colorIndex?: number;
};

const grayCodeByBits: Record<number, string[]> = {
    1: ['0', '1'],
    2: ['00', '01', '11', '10'],
};

const kmapDimensions: Record<
    VariableCount,
    { rowBits: number; colBits: number }
> = {
    2: { rowBits: 1, colBits: 1 },
    3: { rowBits: 1, colBits: 2 },
    4: { rowBits: 2, colBits: 2 },
};

export function createKMapModel(variableCount: VariableCount): KMapModel {
    const { rowBits, colBits } = kmapDimensions[variableCount];

    const rowLabels = grayCodeByBits[rowBits];
    const colLabels = grayCodeByBits[colBits];

    const cells: KMapCell[] = [];

    for (let row = 0; row < rowLabels.length; ++row) {
        for (let col = 0; col < colLabels.length; ++col) {
            const bits = rowLabels[row] + colLabels[col];
            const minterm = parseInt(bits, 2);

            cells.push({
                minterm,
                row,
                col,
                value: 0,
            });
        }
    }

    return {
        variableCount,
        rowLabels,
        colLabels,
        cells,
    };
}

export function updateKMapCell(
    model: KMapModel,
    minterm: number,
    value: KMapCellValue,
): KMapModel {
    const cells = model.cells.map((cell) => {
        if (cell.minterm === minterm) {
            return { ...cell, value };
        }
        return cell;
    });

    return { ...model, cells };
}

export function toggleKMapCell(model: KMapModel, minterm: number): KMapModel {
    const cells = model.cells.map((cell) => {
        if (cell.minterm === minterm) {
            const newValue: KMapCellValue =
                cell.value === 0 ? 1 : cell.value === 1 ? 'X' : 0;
            return { ...cell, value: newValue };
        }
        return cell;
    });

    return { ...model, cells };
}

export function getKMap2DArray(model: KMapModel): KMapCell[][] {
    const array: KMapCell[][] = Array.from(
        { length: model.rowLabels.length },
        () => Array(model.colLabels.length).fill(null) as KMapCell[],
    );

    for (const cell of model.cells) {
        array[cell.row][cell.col] = cell;
    }

    return array;
}

export function canCreateKMapGroup(
    model: KMapModel,
    minterms: number[],
    targetValue: 0 | 1 = 1,
): boolean {
    if (
        minterms.length === 0 ||
        (minterms.length & (minterms.length - 1)) !== 0
    ) {
        return false;
    }

    const selectedCells = minterms.map((minterm) =>
        model.cells.find((cell) => cell.minterm === minterm),
    );

    if (
        selectedCells.some(
            (cell) =>
                cell === undefined ||
                (cell.value !== targetValue && cell.value !== 'X'),
        )
    ) {
        return false;
    }

    if (selectedCells.every((cell) => cell?.value === 'X')) {
        return false;
    }

    const selectedSet = new Set(minterms);
    const rowCount = model.rowLabels.length;
    const colCount = model.colLabels.length;
    const rowSizes = powersOfTwoUpTo(rowCount);
    const colSizes = powersOfTwoUpTo(colCount);

    for (const rowSize of rowSizes) {
        for (const colSize of colSizes) {
            if (rowSize * colSize !== minterms.length) {
                continue;
            }

            for (let rowStart = 0; rowStart < rowCount; rowStart++) {
                for (let colStart = 0; colStart < colCount; colStart++) {
                    const rectangle = getWrappedRectangleMinterms(
                        model,
                        rowStart,
                        colStart,
                        rowSize,
                        colSize,
                    );

                    if (
                        rectangle.length === selectedSet.size &&
                        rectangle.every((minterm) => selectedSet.has(minterm))
                    ) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

function powersOfTwoUpTo(max: number): number[] {
    const values: number[] = [];

    for (let value = 1; value <= max; value *= 2) {
        values.push(value);
    }

    return values;
}

function getWrappedRectangleMinterms(
    model: KMapModel,
    rowStart: number,
    colStart: number,
    rowSize: number,
    colSize: number,
): number[] {
    const rows = getKMap2DArray(model);

    return Array.from({ length: rowSize }).flatMap((_, rowOffset) =>
        Array.from({ length: colSize }).map((__, colOffset) => {
            const row = (rowStart + rowOffset) % model.rowLabels.length;
            const col = (colStart + colOffset) % model.colLabels.length;
            return rows[row][col].minterm;
        }),
    );
}

export function areKMapGroupCellsValid(
    model: KMapModel,
    minterms: number[],
    targetValue: 0 | 1 = 1,
): boolean {
    return minterms.every((minterm) => {
        const cell = model.cells.find((cell) => cell.minterm === minterm);
        return cell?.value === targetValue || cell?.value === 'X';
    });
}

export function areKMapGroupCellsAllDontCare(
    model: KMapModel,
    minterms: number[],
): boolean {
    return (
        minterms.length > 0 &&
        minterms.every((minterm) => {
            const cell = model.cells.find((cell) => cell.minterm === minterm);
            return cell?.value === 'X';
        })
    );
}
