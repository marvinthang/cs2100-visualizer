import type {
    KMapGroup,
    KMapModel,
    VariableCount,
} from '../../core/kmap/kmapModel';
import type { KMapSolveForm, KMapSolvePI } from '../../core/kmap/kmapSolver';
export { parseBooleanExpressionInput } from './booleanExpressionParser';
export {
    checkGroupExpression,
    getGroupExpressionType,
    parseGroupExpressionInput,
    parseGroupLiteralInput,
    type GroupExpressionCheck,
    type KMapGroupExpressionType,
    type ParsedGroupExpressionTerm,
} from './groupExpressionUtils';

export const defaultVariableNames = ['A', 'B', 'C', 'D'];

export function parseMintermsInput(
    input: string,
    maxMinterm: number,
): { minterms: number[]; error: string | null } {
    const text = input.trim();

    if (text === '') {
        return { minterms: [], error: null };
    }

    const tokens = text.split(/[\s,]+/).filter(Boolean);
    const minterms: number[] = [];

    for (const token of tokens) {
        const normalized = token.replace(/^m/i, '');
        if (!/^\d+$/.test(normalized)) {
            return {
                minterms: [],
                error: `Invalid minterm: ${token}`,
            };
        }

        const minterm = Number(normalized);
        if (minterm < 0 || minterm > maxMinterm) {
            return {
                minterms: [],
                error: `Minterm must be between 0 and ${maxMinterm}.`,
            };
        }

        if (!minterms.includes(minterm)) {
            minterms.push(minterm);
        }
    }

    return {
        minterms: minterms.sort((a, b) => a - b),
        error: null,
    };
}

export function hasOverlap(left: number[], right: number[]): boolean {
    return left.some((minterm) => right.includes(minterm));
}

export function parseVariableNamesInput(
    input: string,
    variableCount: VariableCount,
): { names: string[]; error: string | null } {
    const text = input.trim();

    if (text === '') {
        return {
            names: defaultVariableNames.slice(0, variableCount),
            error: null,
        };
    }

    const names = text.split(/[\s,]+/).filter(Boolean);

    if (names.length !== variableCount) {
        return {
            names: defaultVariableNames.slice(0, variableCount),
            error: `Enter exactly ${variableCount} names.`,
        };
    }

    if (new Set(names).size !== names.length) {
        return {
            names: defaultVariableNames.slice(0, variableCount),
            error: 'Variable names must be unique.',
        };
    }

    if (names.some((name) => !/^[A-Za-z]$/.test(name))) {
        return {
            names: defaultVariableNames.slice(0, variableCount),
            error: 'Each variable name must be one letter.',
        };
    }

    return { names, error: null };
}

export function formatSolverTerm(
    term: string,
    variableNames: string[],
): string {
    if ([...term].every((char) => char === '_')) {
        return '1';
    }

    const literals = [...term]
        .map((char, index) => {
            if (char === '_') {
                return '';
            }

            return char === '1'
                ? variableNames[index]
                : `${variableNames[index]}'`;
        })
        .filter(Boolean);

    return literals.join('.');
}

export function formatExpression(
    solution: KMapSolvePI[],
    variableNames: string[],
    form: KMapSolveForm = 'SOP',
): string {
    if (solution.length === 0) {
        return form === 'SOP' ? 'F = 0' : 'F = 1';
    }

    if (form === 'POS') {
        return `F = ${solution
            .map((implicant) => formatPosTerm(implicant.term, variableNames))
            .join('.')}`;
    }

    return `F = ${solution
        .map((implicant) => formatSolverTerm(implicant.term, variableNames))
        .join(' + ')}`;
}

export function formatPosTerm(term: string, variableNames: string[]): string {
    if ([...term].every((char) => char === '_')) {
        return '0';
    }

    const literals = [...term]
        .map((char, index) => {
            if (char === '_') {
                return '';
            }

            return char === '0'
                ? variableNames[index]
                : `${variableNames[index]}'`;
        })
        .filter(Boolean);

    return `(${literals.join(' + ')})`;
}

function getMintermBits(model: KMapModel, minterm: number): string | null {
    const cell = model.cells.find((cell) => cell.minterm === minterm);

    if (cell === undefined) {
        return null;
    }

    return model.rowLabels[cell.row] + model.colLabels[cell.col];
}

export function getGroupTerm(
    model: KMapModel,
    minterms: number[],
): string | null {
    const bitRows = minterms
        .map((minterm) => getMintermBits(model, minterm))
        .filter((bits) => bits !== null);

    if (bitRows.length === 0) {
        return null;
    }

    return Array.from({ length: model.variableCount }, (_, index) => {
        const firstBit = bitRows[0][index];
        const isConstant = bitRows.every((bits) => bits[index] === firstBit);
        return isConstant ? firstBit : '_';
    }).join('');
}

export function formatGroupExpression(
    model: KMapModel,
    minterms: number[],
    variableNames: string[],
    form: KMapSolveForm = 'SOP',
): string {
    const term = getGroupTerm(model, minterms);

    if (term === null) {
        return form === 'SOP' ? 'F = 0' : 'F = 1';
    }

    return `F = ${
        form === 'SOP'
            ? formatSolverTerm(term, variableNames)
            : formatPosTerm(term, variableNames)
    }`;
}

export function formatManualGroupsExpression(
    model: KMapModel,
    groups: KMapGroup[],
    variableNames: string[],
    form: KMapSolveForm = 'SOP',
): string {
    if (groups.length === 0) {
        return form === 'SOP' ? 'F = 0' : 'F = 1';
    }

    const terms = groups
        .map((group) => getGroupTerm(model, group.minterms))
        .filter((term) => term !== null)
        .map((term) =>
            form === 'SOP'
                ? formatSolverTerm(term, variableNames)
                : formatPosTerm(term, variableNames),
        );

    if (terms.length === 0) {
        return form === 'SOP' ? 'F = 0' : 'F = 1';
    }

    return `F = ${terms.join(form === 'SOP' ? ' + ' : '.')}`;
}
