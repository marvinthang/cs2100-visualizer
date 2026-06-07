import { describe, expect, it } from 'vitest';
import { createKMapModel } from '../../core/kmap/kmapModel';
import {
    formatExpression,
    formatManualGroupsExpression,
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

describe('formatExpression', () => {
    it('formats POS factors with readable spacing', () => {
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
        ).toBe('F = (A) (B)');
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
        ).toBe("F = A' + AB'");
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
        ).toBe('F = (A) (B)');
    });
});
