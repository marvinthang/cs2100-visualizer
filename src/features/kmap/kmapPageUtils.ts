import type {
    KMapGroup,
    KMapModel,
    VariableCount,
} from '../../core/kmap/kmapModel';
import { canCreateKMapGroup } from '../../core/kmap/kmapModel';
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

type BooleanExpressionToken =
    | { type: 'var'; value: string }
    | { type: 'apostrophe' }
    | { type: 'and' }
    | { type: 'or' }
    | { type: 'lparen' }
    | { type: 'rparen' }
    | { type: 'eof' };

type BooleanExpressionNode =
    | { type: 'var'; name: string }
    | { type: 'not'; child: BooleanExpressionNode }
    | { type: 'and'; left: BooleanExpressionNode; right: BooleanExpressionNode }
    | { type: 'or'; left: BooleanExpressionNode; right: BooleanExpressionNode };

function tokenizeBooleanExpression(
    input: string,
    variableNames: string[],
): { tokens: BooleanExpressionToken[]; error: string | null } {
    const variableSet = new Set(variableNames);
    const tokens: BooleanExpressionToken[] = [];

    for (let index = 0; index < input.length; index++) {
        const char = input[index];

        if (/\s/.test(char)) {
            continue;
        }

        if (/^[A-Za-z]$/.test(char)) {
            if (!variableSet.has(char)) {
                return {
                    tokens: [],
                    error: `Unknown variable: ${char}`,
                };
            }

            tokens.push({ type: 'var', value: char });
            continue;
        }

        if (char === "'") {
            tokens.push({ type: 'apostrophe' });
            continue;
        }

        if (char === '.') {
            tokens.push({ type: 'and' });
            continue;
        }

        if (char === '+') {
            tokens.push({ type: 'or' });
            continue;
        }

        if (char === '(') {
            tokens.push({ type: 'lparen' });
            continue;
        }

        if (char === ')') {
            tokens.push({ type: 'rparen' });
            continue;
        }

        return {
            tokens: [],
            error: `Invalid character: ${char}`,
        };
    }

    tokens.push({ type: 'eof' });
    return { tokens, error: null };
}

function parseBooleanExpressionTokens(tokens: BooleanExpressionToken[]): {
    node: BooleanExpressionNode | null;
    error: string | null;
} {
    let index = 0;

    function current() {
        return tokens[index];
    }

    function consume() {
        return tokens[index++];
    }

    function isFactorStart(token: BooleanExpressionToken): boolean {
        return token.type === 'var' || token.type === 'lparen';
    }

    function parseOr(): BooleanExpressionNode | null {
        let node = parseAnd();

        if (node === null) {
            return null;
        }

        while (current().type === 'or') {
            consume();
            const right = parseAnd();

            if (right === null) {
                return null;
            }

            node = { type: 'or', left: node, right };
        }

        return node;
    }

    function parseAnd(): BooleanExpressionNode | null {
        let node = parseNot();

        if (node === null) {
            return null;
        }

        while (current().type === 'and' || isFactorStart(current())) {
            if (current().type === 'and') {
                consume();
            }

            const right = parseNot();

            if (right === null) {
                return null;
            }

            node = { type: 'and', left: node, right };
        }

        return node;
    }

    function parseNot(): BooleanExpressionNode | null {
        let node = parsePrimary();

        if (node === null) {
            return null;
        }

        while (current().type === 'apostrophe') {
            consume();
            node = { type: 'not', child: node };
        }

        return node;
    }

    function parsePrimary(): BooleanExpressionNode | null {
        const token = consume();

        if (token.type === 'var') {
            return { type: 'var', name: token.value };
        }

        if (token.type === 'lparen') {
            const node = parseOr();

            if (node === null) {
                return null;
            }

            if (current().type !== 'rparen') {
                return null;
            }

            consume();
            return node;
        }

        return null;
    }

    const node = parseOr();

    if (node === null) {
        return { node: null, error: 'Invalid boolean expression.' };
    }

    if (current().type !== 'eof') {
        return { node: null, error: 'Invalid boolean expression.' };
    }

    return { node, error: null };
}

function evaluateBooleanExpressionNode(
    node: BooleanExpressionNode,
    values: Record<string, boolean>,
): boolean {
    if (node.type === 'var') {
        return values[node.name] ?? false;
    }

    if (node.type === 'not') {
        return !evaluateBooleanExpressionNode(node.child, values);
    }

    if (node.type === 'and') {
        return (
            evaluateBooleanExpressionNode(node.left, values) &&
            evaluateBooleanExpressionNode(node.right, values)
        );
    }

    return (
        evaluateBooleanExpressionNode(node.left, values) ||
        evaluateBooleanExpressionNode(node.right, values)
    );
}

export function parseBooleanExpressionInput(
    input: string,
    model: KMapModel,
    variableNames: string[],
): { minterms: number[]; error: string | null } {
    const text = input.trim();

    if (text === '') {
        return {
            minterms: [],
            error: 'Enter a boolean expression.',
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

    const tokenResult = tokenizeBooleanExpression(text, variableNames);

    if (tokenResult.error !== null) {
        return { minterms: [], error: tokenResult.error };
    }

    const parseResult = parseBooleanExpressionTokens(tokenResult.tokens);

    if (parseResult.error !== null || parseResult.node === null) {
        return {
            minterms: [],
            error: parseResult.error ?? 'Invalid boolean expression.',
        };
    }

    const expressionNode = parseResult.node;
    const minterms = model.cells
        .filter((cell) => {
            const bits = model.rowLabels[cell.row] + model.colLabels[cell.col];
            const values = Object.fromEntries(
                variableNames.map((name, index) => [name, bits[index] === '1']),
            );

            return evaluateBooleanExpressionNode(expressionNode, values);
        })
        .map((cell) => cell.minterm)
        .sort((a, b) => a - b);

    return { minterms, error: null };
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
