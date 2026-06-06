import type { KMapModel, VariableCount } from '../../core/kmap/kmapModel';
import type { KMapSolveForm, KMapSolvePI } from '../../core/kmap/kmapSolver';

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

    return [...term]
        .map((char, index) => {
            if (char === '_') {
                return '';
            }

            return char === '1'
                ? variableNames[index]
                : `${variableNames[index]}'`;
        })
        .join('');
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
            .join(' ')}`;
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

export type KMapGroupExpressionType =
    | 'constant'
    | 'single-literal'
    | 'multi-literal';

export function getGroupExpressionType(term: string): KMapGroupExpressionType {
    const literalCount = [...term].filter((char) => char !== '_').length;

    if (literalCount === 0) {
        return 'constant';
    }

    if (literalCount === 1) {
        return 'single-literal';
    }

    return 'multi-literal';
}

export function parseGroupLiteralInput(
    input: string,
    model: KMapModel,
    variableNames: string[],
    form: KMapSolveForm = 'SOP',
): { minterms: number[]; error: string | null } {
    const text = input.trim();

    if (text === '') {
        return {
            minterms: [],
            error: 'Enter a literal expression.',
        };
    }

    const normalized = text.replace(/\s+/g, '');
    const allMinterms = model.cells
        .map((cell) => cell.minterm)
        .sort((a, b) => a - b);

    if (normalized === (form === 'SOP' ? '1' : '0')) {
        return {
            minterms: allMinterms,
            error: null,
        };
    }

    if (normalized === (form === 'SOP' ? '0' : '1')) {
        return {
            minterms: [],
            error: `${normalized} does not select a ${form} group.`,
        };
    }

    if (
        variableNames.length !== model.variableCount ||
        variableNames.some((name) => !/^[A-Za-z]$/.test(name))
    ) {
        return {
            minterms: [],
            error: 'Each variable name must be one letter.',
        };
    }

    const term = '_'.repeat(model.variableCount).split('');
    const usedVariables = new Set<string>();

    if (form === 'POS') {
        let maxterm = normalized;
        const hasOpeningParen = maxterm.startsWith('(');
        const hasClosingParen = maxterm.endsWith(')');

        if (hasOpeningParen !== hasClosingParen) {
            return {
                minterms: [],
                error: 'POS terms must use matching parentheses.',
            };
        }

        if (hasOpeningParen && hasClosingParen) {
            maxterm = maxterm.slice(1, -1);
        }

        if (maxterm.includes('(') || maxterm.includes(')')) {
            return {
                minterms: [],
                error: "Use one POS term, such as A + B'.",
            };
        }

        const literals = maxterm.split('+');

        if (literals.some((literal) => literal === '')) {
            return {
                minterms: [],
                error: 'POS literals must be separated by +.',
            };
        }

        for (const literal of literals) {
            const variableName = literal[0];
            const isComplemented = literal.endsWith("'");

            if (
                literal.length > 2 ||
                (literal.length === 2 && !isComplemented)
            ) {
                return {
                    minterms: [],
                    error: `Invalid literal: ${literal}.`,
                };
            }

            if (!variableNames.includes(variableName)) {
                return {
                    minterms: [],
                    error: `Unknown variable: ${variableName}.`,
                };
            }

            if (usedVariables.has(variableName)) {
                return {
                    minterms: [],
                    error: `${variableName} appears more than once.`,
                };
            }

            usedVariables.add(variableName);
            term[variableNames.indexOf(variableName)] = isComplemented
                ? '1'
                : '0';
        }
    } else {
        for (let i = 0; i < normalized.length; ++i) {
            const variableName = normalized[i];

            if (variableName === "'") {
                return {
                    minterms: [],
                    error: 'A complement mark must follow a variable.',
                };
            }

            if (!variableNames.includes(variableName)) {
                return {
                    minterms: [],
                    error: `Unknown variable: ${variableName}.`,
                };
            }

            if (usedVariables.has(variableName)) {
                return {
                    minterms: [],
                    error: `${variableName} appears more than once.`,
                };
            }

            usedVariables.add(variableName);

            const pos = variableNames.indexOf(variableName);
            if (i + 1 < normalized.length && normalized[i + 1] === "'") {
                term[pos] = '0';
                ++i;
            } else {
                term[pos] = '1';
            }

            if (i + 1 < normalized.length && normalized[i + 1] === "'") {
                return {
                    minterms: [],
                    error: `${variableName} has too many complement marks.`,
                };
            }
        }
    }

    const minterms = model.cells
        .filter((cell) => {
            const cellBits =
                model.rowLabels[cell.row] + model.colLabels[cell.col];

            for (let index = 0; index < cellBits.length; ++index) {
                if (term[index] !== '_' && term[index] !== cellBits[index]) {
                    return false;
                }
            }

            return true;
        })
        .map((cell) => cell.minterm)
        .sort((a, b) => a - b);

    return {
        minterms,
        error: null,
    };
}
