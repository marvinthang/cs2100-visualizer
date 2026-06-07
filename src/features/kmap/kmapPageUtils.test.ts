import { describe, expect, it } from 'vitest';
import { createKMapModel, updateKMapCell } from '../../core/kmap/kmapModel';
import {
    checkGroupExpression,
    formatExpression,
    formatManualGroupsExpression,
    parseBooleanExpressionInput,
    parseGroupExpressionInput,
    parseGroupLiteralInput,
    parseVariableNamesInput,
} from './kmapPageUtils';

describe('parseVariableNamesInput', () => {
    it('accepts one-letter variable names', () => {
        expect(parseVariableNamesInput('A B C', 3)).toEqual({
            names: ['A', 'B', 'C'],
            error: null,
        });
    });

    it('rejects multi-character or operator variable names', () => {
        expect(parseVariableNamesInput('AA B', 2).error).toBe(
            'Each variable name must be one letter.',
        );
        expect(parseVariableNamesInput('A +', 2).error).toBe(
            'Each variable name must be one letter.',
        );
    });
});

describe('parseGroupLiteralInput', () => {
    it('selects cells from an SOP product literal', () => {
        const model = createKMapModel(2);

        expect(parseGroupLiteralInput("A'", model, ['A', 'B'])).toEqual({
            minterms: [0, 1],
            error: null,
        });
    });

    it('allows dot separators in an SOP product literal', () => {
        const model = createKMapModel(3);

        expect(parseGroupLiteralInput("A.B'", model, ['A', 'B', 'C'])).toEqual({
            minterms: [4, 5],
            error: null,
        });
        expect(parseGroupLiteralInput("A'.C", model, ['A', 'B', 'C'])).toEqual({
            minterms: [1, 3],
            error: null,
        });
        expect(parseGroupLiteralInput('AB', model, ['A', 'B', 'C'])).toEqual({
            minterms: [6, 7],
            error: null,
        });
    });

    it('rejects misplaced SOP AND separators', () => {
        const model = createKMapModel(2);

        expect(parseGroupLiteralInput('A.', model, ['A', 'B']).error).toBe(
            'A literal must follow an AND separator.',
        );
        expect(parseGroupLiteralInput('.A', model, ['A', 'B']).error).toBe(
            'An AND separator must appear between literals.',
        );
    });

    it('selects cells from a POS maxterm literal', () => {
        const model = createKMapModel(2);

        expect(
            parseGroupLiteralInput("(A + B')", model, ['A', 'B'], 'POS'),
        ).toEqual({
            minterms: [1],
            error: null,
        });
    });

    it('uses the right constant selector for SOP and POS', () => {
        const model = createKMapModel(2);

        expect(parseGroupLiteralInput('1', model, ['A', 'B'], 'SOP')).toEqual({
            minterms: [0, 1, 2, 3],
            error: null,
        });
        expect(parseGroupLiteralInput('0', model, ['A', 'B'], 'POS')).toEqual({
            minterms: [0, 1, 2, 3],
            error: null,
        });
        expect(
            parseGroupLiteralInput('0', model, ['A', 'B'], 'SOP').error,
        ).toBe('0 does not select a SOP group.');
        expect(
            parseGroupLiteralInput('1', model, ['A', 'B'], 'POS').error,
        ).toBe('1 does not select a POS group.');
    });
});

describe('parseBooleanExpressionInput', () => {
    it('evaluates SOP expressions with dot AND', () => {
        const model = createKMapModel(2);

        expect(
            parseBooleanExpressionInput("A'.B + A.B'", model, ['A', 'B']),
        ).toEqual({
            minterms: [1, 2],
            error: null,
        });
    });

    it('evaluates parenthesized POS-style expressions', () => {
        const model = createKMapModel(2);

        expect(
            parseBooleanExpressionInput("(A + B').B", model, ['A', 'B']),
        ).toEqual({
            minterms: [3],
            error: null,
        });
    });

    it('supports postfix complement with dot AND', () => {
        const model = createKMapModel(3);

        expect(
            parseBooleanExpressionInput("A'.C", model, ['A', 'B', 'C']),
        ).toEqual({
            minterms: [1, 3],
            error: null,
        });
    });

    it('allows implicit AND', () => {
        const model = createKMapModel(2);

        expect(parseBooleanExpressionInput('AB', model, ['A', 'B'])).toEqual({
            minterms: [3],
            error: null,
        });
        expect(
            parseBooleanExpressionInput("(A + B')B", model, ['A', 'B']),
        ).toEqual({
            minterms: [3],
            error: null,
        });
    });

    it('rejects redundant operator aliases', () => {
        const model = createKMapModel(2);

        expect(
            parseBooleanExpressionInput('A&B', model, ['A', 'B']).error,
        ).toBe('Invalid character: &');
    });

    it('rejects variables outside the current variable list', () => {
        const model = createKMapModel(2);

        expect(parseBooleanExpressionInput('A + C', model, ['A', 'B'])).toEqual(
            {
                minterms: [],
                error: 'Unknown variable: C',
            },
        );
    });

    it('rejects duplicate variable names', () => {
        const model = createKMapModel(2);

        expect(parseBooleanExpressionInput('A', model, ['A', 'A'])).toEqual({
            minterms: [],
            error: 'Variable names must be unique.',
        });
    });
});

describe('parseGroupExpressionInput', () => {
    it('splits SOP expressions into group terms', () => {
        const model = createKMapModel(2);

        expect(
            parseGroupExpressionInput("A'B + AB'", model, ['A', 'B'], 'SOP'),
        ).toEqual({
            terms: [
                { input: "A'B", minterms: [1] },
                { input: "AB'", minterms: [2] },
            ],
            error: null,
        });
    });

    it('splits POS expressions by dot or adjacent factors', () => {
        const model = createKMapModel(2);

        expect(
            parseGroupExpressionInput(
                "(A + B').(A' + B)",
                model,
                ['A', 'B'],
                'POS',
            ),
        ).toEqual({
            terms: [
                { input: "(A+B')", minterms: [1] },
                { input: "(A'+B)", minterms: [2] },
            ],
            error: null,
        });

        expect(
            parseGroupExpressionInput(
                "(A + B')(A' + B)",
                model,
                ['A', 'B'],
                'POS',
            ).terms.map((term) => term.minterms),
        ).toEqual([[1], [2]]);
    });
});

describe('checkGroupExpression', () => {
    it('accepts SOP groups that cover all 1-cells and no 0-cells', () => {
        let model = createKMapModel(2);
        model = updateKMapCell(model, 1, 1);
        model = updateKMapCell(model, 2, 1);

        expect(checkGroupExpression(model, [[1], [2]], 'SOP')).toEqual({
            isCorrect: true,
            missingMinterms: [],
            invalidMinterms: [],
            invalidGroupIndexes: [],
        });
    });

    it('reports missing and invalid SOP cells', () => {
        let model = createKMapModel(2);
        model = updateKMapCell(model, 1, 1);
        model = updateKMapCell(model, 2, 1);

        expect(checkGroupExpression(model, [[0, 1]], 'SOP')).toEqual({
            isCorrect: false,
            missingMinterms: [2],
            invalidMinterms: [0],
            invalidGroupIndexes: [0],
        });
    });

    it('accepts POS groups that cover all 0-cells and no 1-cells', () => {
        let model = createKMapModel(2);
        model = updateKMapCell(model, 1, 1);
        model = updateKMapCell(model, 2, 1);

        expect(checkGroupExpression(model, [[0], [3]], 'POS')).toEqual({
            isCorrect: true,
            missingMinterms: [],
            invalidMinterms: [],
            invalidGroupIndexes: [],
        });
    });
});

describe('formatExpression', () => {
    it('formats POS factors with dot separators', () => {
        expect(
            formatExpression(
                [
                    {
                        minterms: [0, 1],
                        covers: [0, 1],
                        term: '0_',
                        isEPI: true,
                    },
                    {
                        minterms: [0, 2],
                        covers: [0, 2],
                        term: '_0',
                        isEPI: true,
                    },
                ],
                ['A', 'B'],
                'POS',
            ),
        ).toBe('F = (A).(B)');
    });
});

describe('formatManualGroupsExpression', () => {
    it('formats all manual SOP groups as one expression', () => {
        const model = createKMapModel(2);

        expect(
            formatManualGroupsExpression(
                model,
                [
                    { id: 1, minterms: [0, 1] },
                    { id: 2, minterms: [2] },
                ],
                ['A', 'B'],
                'SOP',
            ),
        ).toBe("F = A' + A.B'");
    });

    it('formats all manual POS groups as one expression', () => {
        const model = createKMapModel(2);

        expect(
            formatManualGroupsExpression(
                model,
                [
                    { id: 1, minterms: [0, 1] },
                    { id: 2, minterms: [0, 2] },
                ],
                ['A', 'B'],
                'POS',
            ),
        ).toBe('F = (A).(B)');
    });
});
