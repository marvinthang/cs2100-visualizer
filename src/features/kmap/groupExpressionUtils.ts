import { canCreateKMapGroup, type KMapModel } from '../../core/kmap/kmapModel';
import type { KMapSolveForm } from '../../core/kmap/kmapSolver';

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
            if (normalized[i] === '.') {
                return {
                    minterms: [],
                    error: 'An AND separator must appear between literals.',
                };
            }

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

            if (i + 1 < normalized.length && normalized[i + 1] === '.') {
                i++;

                if (i + 1 >= normalized.length) {
                    return {
                        minterms: [],
                        error: 'A literal must follow an AND separator.',
                    };
                }
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

export type ParsedGroupExpressionTerm = {
    input: string;
    minterms: number[];
};

export function parseGroupExpressionInput(
    input: string,
    model: KMapModel,
    variableNames: string[],
    form: KMapSolveForm = 'SOP',
): { terms: ParsedGroupExpressionTerm[]; error: string | null } {
    const text = input.trim();

    if (text === '') {
        return {
            terms: [],
            error: `Enter a ${form} expression.`,
        };
    }

    const normalized = text.replace(/\s+/g, '');
    const termResult =
        form === 'SOP'
            ? splitSopExpressionTerms(normalized)
            : splitPosExpressionTerms(normalized);

    if (termResult.error !== null) {
        return {
            terms: [],
            error: termResult.error,
        };
    }

    const terms: ParsedGroupExpressionTerm[] = [];

    for (const termInput of termResult.terms) {
        const result = parseGroupLiteralInput(
            termInput,
            model,
            variableNames,
            form,
        );

        if (result.error !== null) {
            return {
                terms: [],
                error: `${termInput}: ${result.error}`,
            };
        }

        terms.push({
            input: termInput,
            minterms: result.minterms,
        });
    }

    return {
        terms,
        error: null,
    };
}

function splitSopExpressionTerms(input: string): {
    terms: string[];
    error: string | null;
} {
    if (input === '0') {
        return { terms: [], error: null };
    }

    const terms = input.split('+');

    if (terms.some((term) => term === '')) {
        return {
            terms: [],
            error: 'SOP terms must be separated by +.',
        };
    }

    return {
        terms,
        error: null,
    };
}

function splitPosExpressionTerms(input: string): {
    terms: string[];
    error: string | null;
} {
    if (input === '1') {
        return { terms: [], error: null };
    }

    const terms: string[] = [];
    let depth = 0;
    let termStart = 0;

    for (let index = 0; index < input.length; index++) {
        const char = input[index];

        if (char === '(') {
            depth++;
            continue;
        }

        if (char === ')') {
            depth--;

            if (depth < 0) {
                return {
                    terms: [],
                    error: 'POS terms must use matching parentheses.',
                };
            }

            if (depth === 0 && input[index + 1] === '(') {
                terms.push(input.slice(termStart, index + 1));
                termStart = index + 1;
            }

            continue;
        }

        if (char === '.' && depth === 0) {
            terms.push(input.slice(termStart, index));
            termStart = index + 1;
        }
    }

    if (depth !== 0) {
        return {
            terms: [],
            error: 'POS terms must use matching parentheses.',
        };
    }

    terms.push(input.slice(termStart));

    if (terms.some((term) => term === '')) {
        return {
            terms: [],
            error: 'POS terms must be separated by .',
        };
    }

    return {
        terms,
        error: null,
    };
}

export type GroupExpressionCheck = {
    isCorrect: boolean;
    missingMinterms: number[];
    invalidMinterms: number[];
    invalidGroupIndexes: number[];
};

export function checkGroupExpression(
    model: KMapModel,
    groups: number[][],
    form: KMapSolveForm = 'SOP',
): GroupExpressionCheck {
    const targetValue = form === 'SOP' ? 1 : 0;
    const invalidValue = form === 'SOP' ? 0 : 1;
    const coveredMinterms = new Set(groups.flat());
    const requiredMinterms = model.cells
        .filter((cell) => cell.value === targetValue)
        .map((cell) => cell.minterm);
    const missingMinterms = requiredMinterms.filter(
        (minterm) => !coveredMinterms.has(minterm),
    );
    const invalidMinterms = model.cells
        .filter(
            (cell) =>
                cell.value === invalidValue &&
                coveredMinterms.has(cell.minterm),
        )
        .map((cell) => cell.minterm);
    const invalidGroupIndexes = groups
        .map((minterms, index) =>
            canCreateKMapGroup(model, minterms, targetValue) ? -1 : index,
        )
        .filter((index) => index !== -1);

    return {
        isCorrect:
            missingMinterms.length === 0 &&
            invalidMinterms.length === 0 &&
            invalidGroupIndexes.length === 0,
        missingMinterms,
        invalidMinterms,
        invalidGroupIndexes,
    };
}
