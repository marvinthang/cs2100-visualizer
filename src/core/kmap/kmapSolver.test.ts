import { describe, expect, it } from 'vitest';
import {
    createKMapModel,
    updateKMapCell,
    type KMapCellValue,
    type KMapModel,
    type VariableCount,
} from './kmapModel';
import { analyzeKMap, getPiTerm, solveKMap } from './kmapSolver';

function withValues(
    variableCount: VariableCount,
    values: Record<number, KMapCellValue>,
): KMapModel {
    return Object.entries(values).reduce(
        (model, [minterm, value]) =>
            updateKMapCell(model, Number(minterm), value),
        createKMapModel(variableCount),
    );
}

describe('getPiTerm', () => {
    it('finds prime implicant terms from adjacent 1 cells', () => {
        const model = withValues(2, { 0: 1, 1: 1 });

        expect(getPiTerm(model)).toEqual(['0_']);
    });

    it('uses dont-cares to form larger groups', () => {
        const model = withValues(2, { 0: 'X', 1: 1 });

        expect(getPiTerm(model)).toEqual(['0_']);
    });
});

describe('solveKMap', () => {
    it('returns no groups when the map has no 1 cells', () => {
        expect(solveKMap(createKMapModel(2))).toEqual([]);
    });

    it('solves a simple 2-variable group', () => {
        const model = withValues(2, { 0: 1, 1: 1 });

        expect(solveKMap(model)).toEqual([
            {
                minterms: [0, 1],
                covers: [0, 1],
                term: '0_',
                isEPI: true,
            },
        ]);
    });

    it('solves a full 2-variable map as one group', () => {
        const model = withValues(2, { 0: 1, 1: 1, 2: 1, 3: 1 });

        expect(solveKMap(model)).toEqual([
            {
                minterms: [0, 1, 2, 3],
                covers: [0, 1, 2, 3],
                term: '__',
                isEPI: true,
            },
        ]);
    });

    it('does not require dont-care cells to be covered', () => {
        const model = withValues(2, { 0: 'X', 1: 1 });

        expect(solveKMap(model)).toEqual([
            {
                minterms: [0, 1],
                covers: [1],
                term: '0_',
                isEPI: true,
            },
        ]);
    });

    it('solves POS by grouping 0 cells', () => {
        const model = withValues(2, { 0: 0, 1: 0, 2: 1, 3: 1 });

        expect(solveKMap(model, 'POS')).toEqual([
            {
                minterms: [0, 1],
                covers: [0, 1],
                term: '0_',
                isEPI: true,
            },
        ]);
    });

    it('uses dont-cares to form larger POS groups', () => {
        const model = withValues(2, { 0: 'X', 1: 0, 2: 1, 3: 1 });

        expect(solveKMap(model, 'POS')).toEqual([
            {
                minterms: [0, 1],
                covers: [1],
                term: '0_',
                isEPI: true,
            },
        ]);
    });
});

describe('analyzeKMap', () => {
    it('returns all prime implicants and the selected solution', () => {
        const model = withValues(2, { 0: 1, 1: 1, 2: 1 });

        const analysis = analyzeKMap(model);

        expect(analysis.primeImplicants.map((pi) => pi.term)).toEqual([
            '_0',
            '0_',
        ]);
        expect(analysis.solution.map((pi) => pi.term)).toEqual(['_0', '0_']);
    });
});
