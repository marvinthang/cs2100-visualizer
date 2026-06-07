import type { KMapModel } from '../../core/kmap/kmapModel';

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

    if (new Set(variableNames).size !== variableNames.length) {
        return {
            minterms: [],
            error: 'Variable names must be unique.',
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
